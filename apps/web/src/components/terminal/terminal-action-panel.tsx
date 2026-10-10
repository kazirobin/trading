'use client';

import { useState } from 'react';
import type { Asset } from '@/lib/binance';

const Icon = ({ d, className = 'h-4 w-4' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export interface TerminalTrade {
  id: string;
  label: string;
  side: 'buy' | 'sell';
  amount: number;
  time: string;
}

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':');
}

export function TerminalActionPanel({
  asset,
  price,
  trades,
  message,
  onTrade,
}: {
  asset: Asset;
  price: number | null;
  trades: TerminalTrade[];
  message: { ok: boolean; text: string } | null;
  onTrade: (side: 'buy' | 'sell', amount: number, seconds: number) => void;
}) {
  const [pending, setPending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [amount, setAmount] = useState(1);
  const [tab, setTab] = useState<'trades' | 'history'>('trades');

  const payout = +(amount * (1 + asset.payout / 100)).toFixed(2);
  const profit = +(amount * (asset.payout / 100)).toFixed(2);

  return (
    <aside className="qt-scroll flex w-full flex-col gap-3 overflow-y-auto">
      <div className="qt-panel rounded-2xl p-4">
        <button className="flex w-full items-center justify-between rounded-xl bg-qt-bg/70 px-3 py-2.5">
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-qt-accent to-[#00E676] text-sm font-extrabold text-white">
              {asset.coin}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[15px] font-bold text-white">{asset.label}</span>
              <span className="block text-[11px] text-qt-mut">Binance spot</span>
            </span>
          </span>
          <span className="text-right leading-tight">
            <span className="block text-[18px] font-extrabold text-qt-gold">{asset.payout}%</span>
            <span className="block text-[10px] uppercase tracking-wide text-qt-mut">payout</span>
          </span>
        </button>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-qt-line bg-qt-bg/50 px-3 py-2.5">
          <span className="text-[13px] font-semibold text-qt-mut">Pending trade</span>
          <button
            onClick={() => setPending((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition ${pending ? 'bg-qt-accent' : 'bg-qt-line'}`}
            aria-label="Pending trade"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${pending ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Time */}
        <div className="relative mt-5 rounded-xl border border-qt-line bg-qt-bg/50 px-3 pb-2.5 pt-3.5">
          <span className="absolute -top-2 left-3 rounded bg-qt-panel px-1.5 text-[10px] font-bold uppercase tracking-wide text-qt-mut">Time</span>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSeconds((s) => Math.max(15, s - 15))}
              className="grid h-8 w-8 place-items-center rounded-full bg-qt-panel2 text-lg font-bold leading-none text-qt-text hover:bg-qt-accent"
            >
              −
            </button>
            <span className="text-xl font-extrabold tabular-nums text-white">{fmtDuration(seconds)}</span>
            <button
              onClick={() => setSeconds((s) => Math.min(3600, s + 15))}
              className="grid h-8 w-8 place-items-center rounded-full bg-qt-panel2 text-lg font-bold leading-none text-qt-text hover:bg-qt-accent"
            >
              +
            </button>
          </div>
          <button className="mt-1.5 block text-[11px] font-semibold text-qt-accent hover:underline">SWITCH TIME</button>
        </div>

        {/* Investment */}
        <div className="relative mt-5 rounded-xl border border-qt-line bg-qt-bg/50 px-3 pb-2.5 pt-3.5">
          <span className="absolute -top-2 left-3 rounded bg-qt-panel px-1.5 text-[10px] font-bold uppercase tracking-wide text-qt-mut">Investment</span>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setAmount((a) => Math.max(1, a - 1))}
              className="grid h-8 w-8 place-items-center rounded-full bg-qt-panel2 text-lg font-bold leading-none text-qt-text hover:bg-qt-accent"
            >
              −
            </button>
            <div className="flex flex-1 items-center justify-center gap-1">
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="w-20 border-none bg-transparent text-center text-xl font-extrabold tabular-nums text-white outline-none"
              />
              <span className="text-lg font-bold text-qt-mut">$</span>
            </div>
            <button
              onClick={() => setAmount((a) => a + 1)}
              className="grid h-8 w-8 place-items-center rounded-full bg-qt-panel2 text-lg font-bold leading-none text-qt-text hover:bg-qt-accent"
            >
              +
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {[1, 5, 10, 50].map((v) => (
                <button key={v} onClick={() => setAmount(v)} className="rounded-md bg-qt-panel2 px-2 py-0.5 text-[11px] font-bold text-qt-mut hover:bg-qt-accent hover:text-white">
                  ${v}
                </button>
              ))}
            </div>
            <button className="text-[11px] font-semibold text-qt-accent hover:underline">SWITCH</button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-[13px] text-qt-mut">Payout</span>
          <span className="text-[18px] font-extrabold tabular-nums text-white">{payout.toFixed(2)} $</span>
        </div>

        <button onClick={() => onTrade('buy', amount, seconds)} className="qt-up-btn mt-3 flex w-full items-center justify-between rounded-xl px-5 py-3.5">
          <span className="text-left leading-tight">
            <span className="block text-lg font-extrabold">Buy</span>
            <span className="block text-[11px] font-semibold opacity-90">Higher +${profit.toFixed(2)}</span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/15">
            <Icon d="M12 19V5M5 12l7-7 7 7" />
          </span>
        </button>
        <button onClick={() => onTrade('sell', amount, seconds)} className="qt-down-btn mt-2.5 flex w-full items-center justify-between rounded-xl px-5 py-3.5">
          <span className="text-left leading-tight">
            <span className="block text-lg font-extrabold">Sell</span>
            <span className="block text-[11px] font-semibold opacity-90">Lower -${profit.toFixed(2)}</span>
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/20">
            <Icon d="M12 5v14M5 12l7 7 7-7" />
          </span>
        </button>

        {message && (
          <p className={`mt-3 text-center text-[12px] font-semibold ${message.ok ? 'text-qt-up' : 'text-qt-down'}`}>{message.text}</p>
        )}
      </div>

      <div className="qt-panel flex min-h-[240px] flex-1 flex-col rounded-2xl p-3">
        <div className="flex items-center gap-1 border-b border-qt-line">
          <button
            onClick={() => setTab('trades')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-bold ${tab === 'trades' ? 'text-white shadow-[inset_0_-2px_0_#2196F3]' : 'text-qt-mut'}`}
          >
            Trades <span className="rounded-full bg-qt-panel2 px-1.5 text-[11px] text-qt-mut">{trades.length}</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`grid h-9 w-9 place-items-center rounded-lg ${tab === 'history' ? 'text-white' : 'text-qt-mut'}`}
            title="History"
          >
            <Icon d="M12 8v4l3 2M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
          </button>
        </div>

        <div className="qt-scroll flex-1 overflow-y-auto pt-3">
          {trades.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-qt-line text-qt-mut">
                <Icon d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" className="h-6 w-6" />
              </span>
              <p className="max-w-[200px] text-[13px] text-qt-mut">You don&apos;t have a trade history yet...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border border-qt-line bg-qt-bg/50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${t.side === 'buy' ? 'bg-qt-up/20 text-qt-up' : 'bg-qt-down/20 text-qt-down'}`}>
                      <Icon d={t.side === 'buy' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} />
                    </span>
                    <div className="leading-tight">
                      <p className="text-[13px] font-bold text-qt-text">{t.label}</p>
                      <p className="text-[11px] text-qt-mut">
                        {t.side.toUpperCase()} · ${t.amount}
                      </p>
                    </div>
                  </div>
                  <span className="text-[12px] font-bold tabular-nums text-qt-mut">{t.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="pt-2 text-center text-[10px] text-qt-mut">
          {price != null ? `Live - ${asset.label}` : 'Connecting to market…'}
        </p>
      </div>
    </aside>
  );
}
