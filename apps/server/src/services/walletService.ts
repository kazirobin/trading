import Big from 'big.js';
import type { ClientSession, Types } from 'mongoose';
import { Wallet, type IWallet } from '../models/Wallet';
import { Transaction, type TxType } from '../models/Transaction';
import { round, toBig, toDecimal, toNum, type DecimalLike } from '../utils/decimal';
import { ApiError } from '../utils/http';

type Id = Types.ObjectId | string;
type Opts = { session?: ClientSession | null; tx?: TxType; note?: string; reference?: string };

function sess(session?: ClientSession | null) {
  return session ?? undefined;
}

function gtExpr(amount: DecimalLike) {
  return { $gte: [{ $subtract: ['$totalBalance', '$lockedBalance'] }, toDecimal(amount)] };
}

export async function ensureWallet(userId: Id, currency: string, session?: ClientSession | null): Promise<IWallet> {
  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency },
    { $setOnInsert: { userId, currency } },
    { upsert: true, new: true, session: sess(session), setDefaultsOnInsert: true },
  );
  if (!wallet) throw new ApiError(500, 'Failed to create wallet');
  return wallet;
}

export async function getBalance(userId: Id, currency: string, session?: ClientSession | null) {
  const wallet = await ensureWallet(userId, currency, session);
  const total = toBig(wallet.totalBalance);
  const locked = toBig(wallet.lockedBalance);
  return { total, locked, available: total.minus(locked) };
}

export async function credit(userId: Id, currency: string, amount: DecimalLike, opts: Opts = {}): Promise<IWallet> {
  const amt = round(amount);
  if (amt.lte(0)) throw ApiError.badRequest('Credit amount must be positive');

  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency },
    { $inc: { totalBalance: toDecimal(amt) } },
    { upsert: true, new: true, session: sess(opts.session), setDefaultsOnInsert: true },
  );
  if (!wallet) throw new ApiError(500, 'Failed to credit wallet');

  await recordTx(userId, currency, amt, 'in', {
    ...opts,
    balanceAfter: wallet.totalBalance,
  });
  return wallet;
}

/** Move funds out of available balance immediately (e.g. withdrawal, fee). */
export async function debitAvailable(userId: Id, currency: string, amount: DecimalLike, opts: Opts = {}): Promise<IWallet> {
  const amt = round(amount);
  if (amt.lte(0)) throw ApiError.badRequest('Debit amount must be positive');

  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency, $expr: gtExpr(amt) },
    { $inc: { totalBalance: toDecimal(amt.neg()) } },
    { new: true, session: sess(opts.session) },
  );
  if (!wallet) throw ApiError.badRequest('Insufficient available balance');

  await recordTx(userId, currency, amt, 'out', {
    ...opts,
    balanceAfter: wallet.totalBalance,
  });
  return wallet;
}

/** Lock funds for an open order (available -> locked). */
export async function lockFunds(userId: Id, currency: string, amount: DecimalLike, opts: Opts = {}): Promise<IWallet> {
  const amt = round(amount);
  if (amt.lte(0)) throw ApiError.badRequest('Lock amount must be positive');

  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency, $expr: gtExpr(amt) },
    { $inc: { lockedBalance: toDecimal(amt) } },
    { new: true, session: sess(opts.session) },
  );
  if (!wallet) throw ApiError.badRequest('Insufficient available balance to place order');
  return wallet;
}

/** Release previously locked funds (locked -> available) on cancel. */
export async function releaseFunds(userId: Id, currency: string, amount: DecimalLike, opts: Opts = {}): Promise<IWallet> {
  const amt = round(amount);
  if (amt.lte(0)) throw ApiError.badRequest('Release amount must be positive');

  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency, $expr: { $gte: ['$lockedBalance', toDecimal(amt)] } },
    { $inc: { lockedBalance: toDecimal(amt.neg()) } },
    { new: true, session: sess(opts.session) },
  );
  if (!wallet) throw new ApiError(500, 'Failed to release locked funds (ledger mismatch)');
  return wallet;
}

/** Consume locked funds: remove from both total and locked (funds leave the account). */
export async function spendLocked(userId: Id, currency: string, amount: DecimalLike, opts: Opts = {}): Promise<IWallet> {
  const amt = round(amount);
  if (amt.lte(0)) return ensureWallet(userId, currency, opts.session);

  const wallet = await Wallet.findOneAndUpdate(
    { userId, currency, $expr: { $gte: ['$lockedBalance', toDecimal(amt)] } },
    { $inc: { totalBalance: toDecimal(amt.neg()), lockedBalance: toDecimal(amt.neg()) } },
    { new: true, session: sess(opts.session) },
  );
  if (!wallet) throw new ApiError(500, 'Failed to settle locked funds (ledger mismatch)');

  await recordTx(userId, currency, amt, 'out', {
    ...opts,
    balanceAfter: wallet.totalBalance,
  });
  return wallet;
}

/** Transfer locked funds from an internal wallet to another user's available balance. */
async function transferLockedTo(
  fromId: Id,
  toId: Id,
  currency: string,
  amount: DecimalLike,
  opts: Opts = {},
): Promise<void> {
  await spendLocked(fromId, currency, amount, opts);
  await credit(toId, currency, amount, opts);
}

async function recordTx(
  userId: Id,
  currency: string,
  amount: Big,
  direction: 'in' | 'out',
  opts: Opts & { balanceAfter?: unknown; typeOverride?: TxType },
) {
  await Transaction.create(
    [
      {
        userId,
        type: opts.typeOverride ?? opts.tx ?? 'adjustment',
        currency,
        amount: toDecimal(amount),
        balanceAfter: opts.balanceAfter ? toDecimal(opts.balanceAfter as DecimalLike) : null,
        status: 'completed',
        note: opts.note ?? null,
        reference: opts.reference ?? null,
        meta: { direction },
      },
    ],
    { session: sess(opts.session) },
  );
}

export { transferLockedTo };
