'use client';

import { useEffect, useState } from 'react';

export interface Asset {
  symbol: string;
  label: string;
  coin: string;
  payout: number;
}

export const ASSETS: Asset[] = [
  { symbol: 'BTCUSDT', label: 'BTC/USDT', coin: 'B', payout: 82 },
  { symbol: 'ETHUSDT', label: 'ETH/USDT', coin: 'E', payout: 80 },
  { symbol: 'BNBUSDT', label: 'BNB/USDT', coin: 'B', payout: 78 },
  { symbol: 'SOLUSDT', label: 'SOL/USDT', coin: 'S', payout: 77 },
  { symbol: 'XRPUSDT', label: 'XRP/USDT', coin: 'X', payout: 75 },
  { symbol: 'DOGEUSDT', label: 'DOGE/USDT', coin: 'D', payout: 74 },
  { symbol: 'ADAUSDT', label: 'ADA/USDT', coin: 'A', payout: 73 },
  { symbol: 'LTCUSDT', label: 'LTC/USDT', coin: 'L', payout: 72 },
];

export const assetOf = (symbol: string): Asset => ASSETS.find((a) => a.symbol === symbol) ?? ASSETS[0]!;

export const INTERVALS = ['1m', '5m', '15m', '1h', '1d'] as const;
export type Interval = (typeof INTERVALS)[number];
export const STEP: Record<Interval, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 };

const REST = ['https://api.binance.com', 'https://data-api.binance.vision'];
const WSH = ['wss://stream.binance.com:9443', 'wss://data-stream.binance.vision:9443'];

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface Ticker {
  c: number;
  o: number;
  h: number;
  l: number;
  v: number;
}

export async function fetchKlines(symbol: string, interval: Interval, limit = 500): Promise<Candle[]> {
  let err: unknown;
  for (const host of REST) {
    try {
      const res = await fetch(`${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = (await res.json()) as unknown[][];
      return rows.map((r) => ({
        time: Math.floor(Number(r[0]) / 1000),
        open: Number(r[1]),
        high: Number(r[2]),
        low: Number(r[3]),
        close: Number(r[4]),
      }));
    } catch (e) {
      err = e;
    }
  }
  throw err instanceof Error ? err : new Error('Binance unreachable');
}

export function useBinanceTickers() {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let host = 0;
    let guard: ReturnType<typeof setTimeout> | null = null;

    const streams = ASSETS.map((a) => `${a.symbol.toLowerCase()}@miniTicker`).join('/');

    const connect = () => {
      if (closed) return;
      setStatus((s) => (s === 'live' ? s : 'connecting'));
      let sock: WebSocket;
      try {
        sock = new WebSocket(`${WSH[host]}/stream?streams=${streams}`);
      } catch {
        setTimeout(connect, 2000);
        return;
      }
      ws = sock;
      guard = setTimeout(() => {
        if (sock === ws && sock.readyState !== WebSocket.OPEN) {
          host = (host + 1) % WSH.length;
          try {
            sock.close();
          } catch {
            /* noop */
          }
        }
      }, 6000);
      sock.onopen = () => {
        if (guard) clearTimeout(guard);
        if (!closed) setStatus('live');
      };
      sock.onmessage = (e) => {
        try {
          const msg = JSON.parse(String(e.data)) as { data?: { s?: string; c?: string; o?: string; h?: string; l?: string; v?: string } };
          const d = msg.data;
          if (!d?.s) return;
          setTickers((prev) => ({
            ...prev,
            [d.s as string]: { c: Number(d.c), o: Number(d.o), h: Number(d.h), l: Number(d.l), v: Number(d.v) },
          }));
        } catch {
          /* noop */
        }
      };
      sock.onerror = () => {
        if (sock === ws) setStatus('offline');
      };
      sock.onclose = () => {
        if (guard) clearTimeout(guard);
        if (closed) return;
        setStatus('offline');
        setTimeout(connect, 2500);
      };
    };

    connect();
    return () => {
      closed = true;
      if (guard) clearTimeout(guard);
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, []);

  return { tickers, status };
}
