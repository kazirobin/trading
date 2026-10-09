'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Chart } from '@/components/chart';
import { OrderBook } from '@/components/orderbook';
import { RecentTrades } from '@/components/recent-trades';
import { OrderForm } from '@/components/order-form';
import { BottomPanel } from '@/components/bottom-panel';
import { getSocket } from '@/lib/socket';
import { fmt, pdec } from '@/lib/format';
import { useMarket } from '@/lib/store';
import type { MarketPair } from '@/lib/types';

const FALLBACK: MarketPair = {
  _id: 'fallback',
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  status: 'trading',
  enabled: true,
  pricePrecision: 2,
  qtyPrecision: 6,
  tickSize: '0.01',
  stepSize: '0.000001',
  minNotional: '10',
  makerFeePct: '0.1',
  takerFeePct: '0.1',
  lastPrice: '65000',
  change24hPct: '0',
  high24h: '0',
  low24h: '0',
  volume24h: '0',
};

function TerminalInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { pairs, prices, setPrice } = useMarket();
  const [refreshKey, setRefreshKey] = useState(0);

  const symbol = (params.get('symbol') || 'BTCUSDT').toUpperCase();
  const pair = useMemo(() => pairs.find((p) => p.symbol === symbol) ?? (pairs[0] ? { ...pairs[0] } : FALLBACK), [pairs, symbol]);
  const price = prices[symbol] ?? Number(pair.lastPrice);
  const change = Number(pair.change24hPct);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('subscribe', { symbol });
    const onPrice = (p: { symbol: string; price: string }) => setPrice(p.symbol, Number(p.price));
    socket.on('price', onPrice);
    return () => {
      socket.emit('unsubscribe', { symbol });
      socket.off('price', onPrice);
    };
  }, [symbol, setPrice]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1600px] px-3 py-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <select
            className="input max-w-[200px]"
            value={symbol}
            onChange={(e) => router.push(`/trade?symbol=${e.target.value}`)}
          >
            {(pairs.length ? pairs : [FALLBACK]).map((p) => (
              <option key={p.symbol} value={p.symbol}>
                {p.symbol}
              </option>
            ))}
          </select>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold tabular-nums">{fmt(price, pdec(price))}</span>
            <span className={change >= 0 ? 'text-up' : 'text-down'}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
            </span>
          </div>
          <div className="ml-auto flex gap-4 text-xs text-mut">
            <span>
              24h High <b className="text-txt">{fmt(Number(pair.high24h), pdec(Number(pair.high24h)))}</b>
            </span>
            <span>
              24h Low <b className="text-txt">{fmt(Number(pair.low24h), pdec(Number(pair.low24h)))}</b>
            </span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          <div className="card min-h-[420px] p-3">
            <Chart symbol={symbol} />
          </div>

          <div className="space-y-3">
            <OrderForm pair={{ ...pair, lastPrice: String(price) }} onPlaced={() => setRefreshKey((k) => k + 1)} />
            <div className="card h-[360px] overflow-hidden p-2">
              <div className="grid h-full grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <p className="mb-1 px-1 text-xs font-semibold uppercase text-mut">Order book</p>
                  <div className="min-h-0 flex-1">
                    <OrderBook symbol={symbol} />
                  </div>
                </div>
                <div className="flex flex-col border-l border-line pl-2">
                  <p className="mb-1 px-1 text-xs font-semibold uppercase text-mut">Recent trades</p>
                  <div className="min-h-0 flex-1">
                    <RecentTrades symbol={symbol} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 h-[320px]">
          <BottomPanel refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-mut">Loading terminal…</div>}>
      <TerminalInner />
    </Suspense>
  );
}
