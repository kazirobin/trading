'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { fmt, pdec } from '@/lib/format';
import type { TradeDto } from '@/lib/types';

export function RecentTrades({ symbol }: { symbol: string }) {
  const [trades, setTrades] = useState<TradeDto[]>([]);

  useEffect(() => {
    api
      .get<TradeDto[]>(`/api/markets/${symbol}/trades?limit=25`)
      .then(setTrades)
      .catch(() => undefined);

    const socket = getSocket();
    const onTrade = (t: { symbol: string; price: string; amount: string; takerSide: 'buy' | 'sell'; ts: number }) => {
      if (t.symbol !== symbol) return;
      setTrades((prev) =>
        [
          {
            _id: `${t.ts}-${Math.random()}`,
            symbol: t.symbol,
            price: t.price,
            amount: t.amount,
            quoteAmount: String(Number(t.price) * Number(t.amount)),
            takerSide: t.takerSide,
            makerUserId: '',
            takerUserId: '',
            createdAt: new Date(t.ts).toISOString(),
          },
          ...prev,
        ].slice(0, 25),
      );
    };
    socket.on('trade', onTrade);
    return () => {
      socket.off('trade', onTrade);
    };
  }, [symbol]);

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="grid grid-cols-3 px-2 py-1 font-semibold uppercase tracking-wide text-mut">
        <span>Price</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {trades.map((t) => {
          const price = Number(t.price);
          const d = new Date(t.createdAt);
          return (
            <div key={t._id} className="grid grid-cols-3 px-2 py-0.5 tabular-nums">
              <span className={t.takerSide === 'buy' ? 'text-up' : 'text-down'}>{fmt(price, pdec(price))}</span>
              <span className="text-right">{fmt(Number(t.amount), 4)}</span>
              <span className="text-right text-mut">
                {String(d.getHours()).padStart(2, '0')}:{String(d.getMinutes()).padStart(2, '0')}:{String(d.getSeconds()).padStart(2, '0')}
              </span>
            </div>
          );
        })}
        {trades.length === 0 && <p className="py-6 text-center text-mut">No recent trades</p>}
      </div>
    </div>
  );
}
