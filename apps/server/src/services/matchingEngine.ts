import Big from 'big.js';
import type { ClientSession, Types } from 'mongoose';
import { MarketPair, type IMarketPair } from '../models/MarketPair';
import { Order, type IOrder, type OrderSide, type OrderType } from '../models/Order';
import { Trade } from '../models/Trade';
import { User } from '../models/User';
import { env } from '../config/env';
import { ApiError } from '../utils/http';
import { floorToStep, maxBig, minBig, round, toBig, toDecimal, toNum, type DecimalLike } from '../utils/decimal';
import * as wallet from './walletService';
import { emitOrder, emitTrade } from './realtime';

/* ------------------------------------------------------------------ */
/* Per-symbol mutex (single-process safety for the matching engine).  */
/* ------------------------------------------------------------------ */
const chains = new Map<string, Promise<unknown>>();
function withSymbolLock<T>(symbol: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(symbol) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  chains.set(
    symbol,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

let feeAccountId: Types.ObjectId | null = null;
async function getFeeAccountId(session?: ClientSession | null): Promise<Types.ObjectId> {
  if (feeAccountId) return feeAccountId;
  const feeUser = await User.findOne({ email: env.FEE_ACCOUNT_EMAIL }).session(session ?? null);
  if (!feeUser) throw new ApiError(500, 'Fee account not configured (run seed)');
  feeAccountId = feeUser._id;
  return feeAccountId;
}

const MARKET_BUY_BUFFER = new Big(1.05); // 5% buffer for market buys

export type PlaceOrderInput = {
  userId: Types.ObjectId | string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: DecimalLike;
  price?: DecimalLike | null;
  stopPrice?: DecimalLike | null;
};

function lockPerUnit(order: IOrder): Big {
  const amount = toBig(order.amount);
  if (amount.lte(0)) return new Big(0);
  return toBig(order.lockedAmount).div(amount);
}

function isMarket(type: OrderType): boolean {
  return type === 'market' || type === 'stop_market';
}

function isStop(type: OrderType): boolean {
  return type === 'stop_limit' || type === 'stop_market';
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function placeOrder(input: PlaceOrderInput): Promise<IOrder> {
  return withSymbolLock(input.symbol, () => placeOrderInner(input));
}

async function placeOrderInner(input: PlaceOrderInput): Promise<IOrder> {
  const pair = await MarketPair.findOne({ symbol: input.symbol.toUpperCase(), enabled: true });
  if (!pair) throw ApiError.notFound(`Market ${input.symbol} not found or disabled`);

  const amount = floorToStep(input.amount, pair.stepSize);
  if (amount.lte(0)) throw ApiError.badRequest('Amount is below the minimum step size');
  if (amount.gt(new Big(1e12))) throw ApiError.badRequest('Amount too large');

  const price = input.price != null ? round(input.price, pair.pricePrecision) : null;
  const stopPrice = input.stopPrice != null ? round(input.stopPrice, pair.pricePrecision) : null;

  if (!isMarket(input.type) && (price == null || toBig(price).lte(0))) {
    throw ApiError.badRequest('Limit price is required');
  }
  if (isStop(input.type) && (stopPrice == null || toBig(stopPrice).lte(0))) {
    throw ApiError.badRequest('Stop price is required');
  }

  const refPrice = await referencePrice(pair, input.side, price);
  const notional = amount.times(refPrice);
  if (notional.lt(toBig(pair.minNotional))) {
    throw ApiError.badRequest(`Order notional below minimum (${pair.minNotional.toString()})`);
  }

  // Determine funds to lock.
  const { lockCurrency, lockAmount } = computeLock(pair, input.side, input.type, amount, price, refPrice);

  await wallet.lockFunds(input.userId, lockCurrency, lockAmount, { reference: `order:${input.symbol}` });

  const order = await Order.create({
    userId: input.userId,
    symbol: pair.symbol,
    side: input.side,
    type: input.type,
    status: 'open',
    price: isMarket(input.type) ? null : toDecimal(price as DecimalLike),
    stopPrice: isStop(input.type) ? toDecimal(stopPrice as DecimalLike) : null,
    amount: toDecimal(amount),
    filled: toDecimal(0),
    remaining: toDecimal(amount),
    avgFillPrice: toDecimal(0),
    quoteAmount: toDecimal(0),
    lockedCurrency: lockCurrency,
    lockedAmount: toDecimal(lockAmount),
    feePaid: toDecimal(0),
    feeCurrency: pair.quoteAsset,
    triggered: !isStop(input.type),
  });

  emitOrder({ userId: String(input.userId), orderId: order.id, symbol: order.symbol, status: order.status, side: order.side });

  // Stop orders rest until triggered by a price move.
  if (isStop(input.type) && !order.triggered) {
    return order;
  }

  await matchOrder(order, pair);
  return (await Order.findById(order._id)) ?? order;
}

export async function cancelOrder(userId: Types.ObjectId | string, orderId: string): Promise<IOrder> {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw ApiError.notFound('Order not found');
  if (!['open', 'partial'].includes(order.status)) throw ApiError.badRequest('Order cannot be canceled');
  return withSymbolLock(order.symbol, () => cancelInner(order));
}

async function cancelInner(order: IOrder): Promise<IOrder> {
  const remainingLock =
    order.side === 'buy' ? round(toBig(order.remaining).times(lockPerUnit(order))) : toBig(order.remaining);
  if (remainingLock.gt(0)) {
    await wallet.releaseFunds(order.userId, order.lockedCurrency, remainingLock);
  }
  order.status = 'canceled';
  order.lockedAmount = toDecimal(0);
  order.cancelReason = 'user_cancel';
  order.closedAt = new Date();
  await order.save();
  emitOrder({ userId: String(order.userId), orderId: order.id, symbol: order.symbol, status: order.status, side: order.side });
  return order;
}

/** Called whenever a fresh price arrives (e.g. from the market data feed). */
export async function onPriceTick(symbol: string, price: DecimalLike): Promise<void> {
  const pair = await MarketPair.findOne({ symbol: symbol.toUpperCase() });
  if (!pair) return;
  pair.lastPrice = toDecimal(price);
  await pair.save();

  const stops = await Order.find({ symbol: pair.symbol, status: { $in: ['open', 'partial'] }, type: { $in: ['stop_limit', 'stop_market'] }, triggered: false });
  const p = toBig(price);
  for (const stop of stops) {
    const sp = toBig(stop.stopPrice);
    const hit = stop.side === 'buy' ? p.gte(sp) : p.lte(sp);
    if (!hit) continue;
    await withSymbolLock(pair.symbol, async () => {
      stop.triggered = true;
      if (stop.type === 'stop_market') stop.type = 'market';
      await stop.save();
      await matchOrder(stop, pair);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Internals                                                           */
/* ------------------------------------------------------------------ */

async function referencePrice(pair: IMarketPair, side: OrderSide, price: DecimalLike | null): Promise<Big> {
  if (price != null && toBig(price).gt(0)) return toBig(price);
  const best = await bestOppositePrice(pair.symbol, side);
  if (best.gt(0)) return best;
  const lastPrice = toBig(pair.lastPrice);
  if (lastPrice.gt(0)) return lastPrice;
  throw ApiError.badRequest('No reference price available');
}

async function bestOppositePrice(symbol: string, side: OrderSide): Promise<Big> {
  const opposite = side === 'buy' ? 'sell' : 'buy';
  const sort = opposite === 'sell' ? 1 : -1;
  const top = await Order.findOne({ symbol, side: opposite, status: { $in: ['open', 'partial'] } }).sort({ price: sort, createdAt: 1 });
  return top ? toBig(top.price) : new Big(0);
}

function computeLock(
  pair: IMarketPair,
  side: OrderSide,
  type: OrderType,
  amount: Big,
  price: DecimalLike | null,
  refPrice: Big,
): { lockCurrency: string; lockAmount: Big } {
  if (side === 'sell') return { lockCurrency: pair.baseAsset, lockAmount: amount };
  const limitForLock = !isMarket(type) && price != null ? toBig(price) : refPrice.times(MARKET_BUY_BUFFER);
  return { lockCurrency: pair.quoteAsset, lockAmount: round(amount.times(limitForLock)) };
}

async function matchOrder(taker: IOrder, pair: IMarketPair): Promise<void> {
  const opposite = taker.side === 'buy' ? 'sell' : 'buy';
  const sort = opposite === 'sell' ? { price: 1 as const, createdAt: 1 as const } : { price: -1 as const, createdAt: 1 as const };
  const resting = await Order.find({
    symbol: taker.symbol,
    side: opposite,
    status: { $in: ['open', 'partial'] },
    _id: { $ne: taker._id },
  })
    .sort(sort)
    .limit(100);

  const marketTaker = isMarket(taker.type);
  const limitPrice = taker.price != null ? toBig(taker.price) : null;
  let lastTraded: Big | null = null;

  for (const maker of resting) {
    if (toBig(taker.remaining).lte(0)) break;
    const makerPrice = toBig(maker.price);
    if (!marketTaker && limitPrice) {
      if (taker.side === 'buy' && makerPrice.gt(limitPrice)) break;
      if (taker.side === 'sell' && makerPrice.lt(limitPrice)) break;
    }

    let q = minBig(taker.remaining, maker.remaining);
    q = floorToStep(q, pair.stepSize);
    if (q.lte(0)) continue;

    const price = makerPrice;
    await executeFill(taker, maker, pair, q, price);
    lastTraded = price;
  }

  // Market orders cannot rest: cancel whatever is left and refund the remainder.
  if (marketTaker && toBig(taker.remaining).gt(0)) {
    const remainingLock = taker.side === 'buy' ? round(toBig(taker.remaining).times(lockPerUnit(taker))) : toBig(taker.remaining);
    if (remainingLock.gt(0)) await wallet.releaseFunds(taker.userId, taker.lockedCurrency, remainingLock);
    taker.lockedAmount = toDecimal(0);
    taker.status = toBig(taker.filled).gt(0) ? 'filled' : 'canceled';
    taker.cancelReason = toBig(taker.filled).gt(0) ? 'ioc_partial' : 'no_liquidity';
    taker.closedAt = new Date();
    await taker.save();
    emitOrder({ userId: String(taker.userId), orderId: taker.id, symbol: taker.symbol, status: taker.status, side: taker.side });
  } else {
    await taker.save();
  }

  if (lastTraded) {
    pair.lastPrice = toDecimal(lastTraded);
    await pair.save();
  }
}

async function executeFill(
  taker: IOrder,
  maker: IOrder,
  pair: IMarketPair,
  q: Big,
  price: Big,
): Promise<void> {
  const quote = round(q.times(price));
  const buyer = taker.side === 'buy' ? taker : maker;
  const seller = taker.side === 'buy' ? maker : taker;
  const buyerIsTaker = buyer === taker;

  const base = pair.baseAsset;
  const quoteCur = pair.quoteAsset;
  const makerFeePct = toBig(pair.makerFeePct);
  const takerFeePct = toBig(pair.takerFeePct);
  const buyerFeePct = buyerIsTaker ? takerFeePct : makerFeePct;
  const sellerFeePct = buyerIsTaker ? makerFeePct : takerFeePct;

  const buyerFee = round(quote.times(buyerFeePct).div(100));
  const sellerFee = round(quote.times(sellerFeePct).div(100));

  const feeId = await getFeeAccountId();

  // ---- Buyer: settle reserved quote, receive base (fee taken in base) ----
  const reserved = round(q.times(lockPerUnit(buyer)));
  await wallet.spendLocked(buyer.userId, quoteCur, reserved, { tx: 'trade', reference: `trade:${pair.symbol}` });
  if (reserved.gt(quote)) {
    await wallet.credit(buyer.userId, quoteCur, reserved.minus(quote), { reference: `trade-refund:${pair.symbol}` });
  } else if (reserved.lt(quote)) {
    await wallet.debitAvailable(buyer.userId, quoteCur, quote.minus(reserved), { tx: 'trade', reference: `trade:${pair.symbol}` });
  }
  await wallet.credit(buyer.userId, base, q.minus(buyerFee), { reference: `trade:${pair.symbol}` });
  if (buyerFee.gt(0)) await wallet.credit(feeId, base, buyerFee, { tx: 'fee' });

  // ---- Seller: give base from locked, receive quote (fee taken in quote) ----
  await wallet.spendLocked(seller.userId, base, q, { tx: 'trade', reference: `trade:${pair.symbol}` });
  await wallet.credit(seller.userId, quoteCur, quote.minus(sellerFee), { reference: `trade:${pair.symbol}` });
  if (sellerFee.gt(0)) await wallet.credit(feeId, quoteCur, sellerFee, { tx: 'fee' });

  // ---- Update both orders ----
  bumpOrder(maker, q, price, false);
  bumpOrder(taker, q, price, true);
  await maker.save();
  await taker.save();

  await Trade.create({
    symbol: pair.symbol,
    price: toDecimal(price),
    amount: toDecimal(q),
    quoteAmount: toDecimal(quote),
    takerSide: taker.side,
    makerOrderId: maker._id,
    takerOrderId: taker._id,
    makerUserId: maker.userId,
    takerUserId: taker.userId,
    makerFee: toDecimal(buyerIsTaker ? sellerFee : buyerFee),
    takerFee: toDecimal(buyerIsTaker ? buyerFee : sellerFee),
    feeCurrency: quoteCur,
  });

  emitTrade({ symbol: pair.symbol, price: price.toString(), amount: q.toString(), takerSide: taker.side, ts: Date.now() });
  emitOrder({ userId: String(maker.userId), orderId: maker.id, symbol: maker.symbol, status: maker.status, side: maker.side });
}

function bumpOrder(order: IOrder, q: Big, price: Big, isBuyerConsume: boolean): void {
  void isBuyerConsume;
  const filled = toBig(order.filled);
  const newFilled = filled.plus(q);
  const prevQuote = toBig(order.avgFillPrice).times(filled);
  const newAvg = newFilled.gt(0) ? round(prevQuote.plus(q.times(price)).div(newFilled)) : new Big(0);

  order.filled = toDecimal(newFilled);
  order.remaining = toDecimal(maxBig(toBig(order.amount).minus(newFilled), 0));
  order.avgFillPrice = toDecimal(newAvg);
  order.quoteAmount = toDecimal(toBig(order.quoteAmount).plus(round(q.times(price))));

  // Reduce the amount still locked for this order.
  if (order.side === 'buy') {
    const consumed = round(q.times(lockPerUnit(order)));
    order.lockedAmount = toDecimal(maxBig(toBig(order.lockedAmount).minus(consumed), 0));
  } else {
    order.lockedAmount = toDecimal(maxBig(toBig(order.lockedAmount).minus(q), 0));
  }

  if (toBig(order.remaining).lte(0)) {
    order.status = 'filled';
    order.closedAt = new Date();
  } else {
    order.status = 'partial';
  }
}

export { toNum };
