import { EventEmitter } from 'node:events';

export type TradeEvent = {
  symbol: string;
  price: string;
  amount: string;
  takerSide: 'buy' | 'sell';
  ts: number;
};

export type OrderEvent = {
  userId: string;
  orderId: string;
  symbol: string;
  status: string;
  side: 'buy' | 'sell';
};

export type PriceEvent = { symbol: string; price: string; ts: number };

class RealtimeBus extends EventEmitter {}

export const realtime = new RealtimeBus();
realtime.setMaxListeners(0);

export const emitTrade = (t: TradeEvent) => realtime.emit('trade', t);
export const emitOrder = (o: OrderEvent) => realtime.emit('order', o);
export const emitPrice = (p: PriceEvent) => realtime.emit('price', p);
