'use client';

import { useEffect, useState } from 'react';
import { fetchKlines } from '@/lib/binance';

export function TerminalRatioBar({ symbol }: { symbol: string }) {
  const [ratio, setRatio] = useState({ buy: 50, sell: 50 });

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchKlines(symbol, '1m', 60)
        .then((data) => {
          if (cancelled || !data.length) return;
          const up = data.filter((c) => c.close >= c.open).length;
          const buy = Math.round((up / data.length) * 100);
          setRatio({ buy, sell: 100 - buy });
        })
        .catch(() => undefined);
    load();
    const t = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [symbol]);

  return (
    <aside className="hidden w-9 shrink-0 flex-col items-center gap-2 rounded-2xl glass-strong py-2.5 lg:flex" aria-label="Buy / Sell ratio">
      <span className="text-[10px] font-bold tabular-nums text-emerald-500">{ratio.buy}%</span>
      <div className="relative w-2 flex-1 overflow-hidden rounded-full bg-neo-line">
        <div
          className="absolute inset-x-0 top-0 rounded-full bg-emerald-500 transition-all duration-700"
          style={{ height: `${ratio.buy}%` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 rounded-full bg-rose-500 transition-all duration-700"
          style={{ height: `${ratio.sell}%` }}
        />
        <span
          className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-neo-text transition-all duration-700"
          style={{ top: `calc(${ratio.buy}% - 5px)` }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-rose-500">{ratio.sell}%</span>
    </aside>
  );
}