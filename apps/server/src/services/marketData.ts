import { env } from '../config/env';
import { MarketPair } from '../models/MarketPair';
import { onPriceTick } from './matchingEngine';
import { emitPrice } from './realtime';

const BINANCE_WS = 'wss://stream.binance.com:9443';
const THROTTLE_MS = 1000;

let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
const lastProcessed = new Map<string, number>();

/**
 * Streams live Binance prices and forwards them to the matching engine so that
 * stop orders trigger and markets keep an up-to-date last price.
 * Enable with MARKET_FEED=binance (default on in development).
 */
export async function startMarketFeed(): Promise<void> {
  if (env.NODE_ENV === 'test') return;

  const pairs = await MarketPair.find({ enabled: true, status: 'trading' }).lean();
  const streams = pairs.map((p) => `${p.symbol.toLowerCase()}@miniTicker`).join('/');
  if (!streams) return;

  const url = `${BINANCE_WS}/stream?streams=${streams}`;
  connect(url);
  console.log('[market] binance feed starting');
}

function connect(url: string): void {
  try {
    socket = new WebSocket(url);
  } catch (err) {
    scheduleReconnect(url);
    return;
  }

  socket.onopen = () => console.log('[market] binance feed connected');
  socket.onerror = () => console.warn('[market] binance feed error');
  socket.onclose = () => scheduleReconnect(url);
  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(String(event.data)) as { data?: { s?: string; c?: string } };
      const d = msg.data;
      if (!d?.s || !d.c) return;
      const symbol = d.s.toUpperCase();
      const price = d.c;
      emitPrice({ symbol, price, ts: Date.now() });

      const now = Date.now();
      const last = lastProcessed.get(symbol) ?? 0;
      if (now - last < THROTTLE_MS) return;
      lastProcessed.set(symbol, now);
      void onPriceTick(symbol, price).catch(() => undefined);
    } catch {
      /* ignore malformed ticks */
    }
  };
}

function scheduleReconnect(url: string): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    console.log('[market] reconnecting binance feed...');
    connect(url);
  }, 3000);
}

export function stopMarketFeed(): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  socket?.close();
  socket = null;
}
