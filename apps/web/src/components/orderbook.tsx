'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fmt, pdec } from '@/lib/format';
import type { Depth } from '@/lib/types';

export function OrderBook({ symbol }: { symbol: string }) {
  const [depth, setDepth] = useState<Depth | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    api
      .get<Depth>(`/api/markets/${symbol}/depth?limit=14`)
      .then(setDepth)
      .catch(() => undefined);
  }, [symbol]);

  useEffect(() => {
    load();
    const socket = getSocket();
    const onTrade = (t: { symbol: string }) => {
      if (t.symbol !== symbol) return;
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        load();
      }, 500);
    };
    socket.on('trade', onTrade);
    const id = window.setInterval(load, 5000);
    return () => {
      socket.off('trade', onTrade);
      window.clearInterval(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [symbol, load]);

  const asks = [...(depth?.asks ?? [])].reverse();
  const bids = depth?.bids ?? [];
  const max = Math.max(1, ...[...asks, ...bids].map((l) => l.amount));

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="grid grid-cols-3 px-2 py-1 font-semibold uppercase tracking-wide text-mut">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-0.5">
        {asks.map((l, i) => (
          <Row key={`a${i}`} level={l} max={max} side="ask" />
        ))}
        {asks.length === 0 && <p className="py-4 text-center text-mut">No asks</p>}
      </div>

      <div className="my-1 border-y border-line py-1 text-center text-sm font-bold tabular-nums">
        {depth ? fmt(bids[0]?.price ?? asks[asks.length - 1]?.price ?? 0, pdec(bids[0]?.price ?? 1)) : '—'}
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {bids.map((l, i) => (
          <Row key={`b${i}`} level={l} max={max} side="bid" />
        ))}
        {bids.length === 0 && <p className="py-4 text-center text-mut">No bids</p>}
      </div>
    </div>
  );
}

function Row({ level, max, side }: { level: { price: number; amount: number; orders: number }; max: number; side: 'ask' | 'bid' }) {
  const width = Math.min(100, (level.amount / max) * 100);
  return (
    <div className="relative grid grid-cols-3 px-2 py-0.5 tabular-nums">
      <span
        className={`absolute inset-y-0 right-0 ${side === 'ask' ? 'bg-down/10' : 'bg-up/10'}`}
        style={{ width: `${width}%` }}
      />
      <span className={side === 'ask' ? 'relative text-down' : 'relative text-up'}>{fmt(level.price, pdec(level.price))}</span>
      <span className="relative text-right">{fmt(level.amount, 4)}</span>
      <span className="relative text-right text-mut">{fmt(level.price * level.amount, 2)}</span>
    </div>
  );
}
