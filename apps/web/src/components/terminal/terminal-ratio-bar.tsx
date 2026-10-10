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
    <aside className="hidden w-9 shrink-0 flex-col items-center gap-2.5 rounded-2xl glass-strong py-3 lg:flex" aria-label="Buy / Sell ratio">
      <span className="text-[10px] font-extrabold tabular-nums text-emerald-300 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">{ratio.buy}%</span>
      <div className="relative w-2 flex-1 overflow-hidden rounded-full bg-neo-line/40">
        <div
          className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_0_12px_2px_rgba(16,185,129,0.45)] transition-all duration-700"
          style={{ height: `${ratio.buy}%` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-rose-400 to-rose-500 shadow-[0_0_12px_2px_rgba(255,84,112,0.45)] transition-all duration-700"
          style={{ height: `${ratio.sell}%` }}
        />
        <span
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-neo-bg shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-700"
          style={{ top: `calc(${ratio.buy}% - 6px)` }}
        />
      </div>
      <span className="text-[10px] font-extrabold tabular-nums text-rose-400 drop-shadow-[0_0_6px_rgba(255,84,112,0.6)]">{ratio.sell}%</span>
    </aside>
  );
}