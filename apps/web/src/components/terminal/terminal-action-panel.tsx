'use client';

import { useState } from 'react';
import type { Asset } from '@/lib/binance';

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

function ControlBox({ label, bottom, children }: { label: string; bottom: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-white/5 bg-white/[0.03] px-3 pb-3 pt-4 backdrop-blur-xl">
      <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 bg-neo-bg px-1.5 text-[9px] font-semibold uppercase tracking-wide text-neo-mut">{label}</span>
      {children}
      <button
        type="button"
        className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 bg-neo-bg px-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400 hover:underline"
      >
        {bottom}
      </button>
    </div>
  );
}

function StepButton({ children, disabled, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-neo-text transition-all hover:border-sky-400/40 hover:bg-white/[0.08] hover:shadow-[0_0_12px_-4px_rgba(43,153,255,0.7)] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Flags({ base, quote }: { base: string; quote: string }) {
  return (
    <span className="flex -space-x-2">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-[10px] font-bold text-white ring-2 ring-neo-panel2">
        {base[0]}
      </span>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] font-bold text-white ring-2 ring-neo-panel2">
        {quote[0]}
      </span>
    </span>
  );
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
  const [pending, setPending] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [seconds, setSeconds] = useState(60);
  const [amount, setAmount] = useState(1);

  const payout = +(amount * (1 + asset.payout / 100)).toFixed(2);
  const [base, quote] = asset.label.split('/');

  return (
    <aside className="neo-scroll flex w-full shrink-0 flex-col gap-4 overflow-y-auto p-3 lg:w-[228px] lg:border-l lg:border-white/5">
      <div className="flex flex-col gap-3 rounded-2xl glass-strong p-3">
        {/* asset header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Flags base={base} quote={quote ?? base} />
            <span className="text-[13px] font-bold uppercase tracking-wide text-white">
              {asset.label} <span className="text-[9px] font-semibold text-neo-mut">(OTC)</span>
            </span>
          </span>
          <span className="rounded-lg border border-amber-300/30 bg-gradient-to-b from-amber-400/15 to-amber-500/5 px-2 py-0.5 text-[14px] font-extrabold tabular-nums text-amber-300 shadow-[0_0_16px_-6px_rgba(251,191,36,0.8)]">
            {asset.payout}%
          </span>
        </div>

        {/* iOS-style pending toggle */}
        <div className="flex items-center justify-between px-0.5">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em]">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-violet-400">Pending trade</span>
          </span>
          <button
            onClick={() => setPending((v) => !v)}
            role="switch"
            aria-checked={pending}
            aria-label="Pending trade"
            className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
              pending
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_16px_-4px_rgba(16,185,129,0.8)]'
                : 'bg-white/10'
            }`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${pending ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* time + investment */}
        <ControlBox label="Time" bottom="Switch time">
          <div className="flex items-center gap-2">
            <StepButton onClick={() => setSeconds((s) => Math.max(5, s - 5))}>
              <svg width="8" height="2" viewBox="0 0 8 2"><path d="M8 0v1.54H0V0z" fill="currentColor" /></svg>
            </StepButton>
            <span className="flex-1 text-center text-[17px] font-bold tabular-nums tracking-wide text-white">{fmtDuration(seconds)}</span>
            <StepButton onClick={() => setSeconds((s) => Math.min(14400, s + 5))}>
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M3.23 0h1.54v3.23H8v1.54H4.77V8H3.23V4.77H0V3.23h3.23z" fill="currentColor" /></svg>
            </StepButton>
          </div>
        </ControlBox>

        <ControlBox label="Investment" bottom="Switch">
          <div className="flex items-center gap-2">
            <StepButton disabled={amount <= 1} onClick={() => setAmount((a) => Math.max(1, a - 1))}>
              <svg width="8" height="2" viewBox="0 0 8 2"><path d="M8 0v1.54H0V0z" fill="currentColor" /></svg>
            </StepButton>
            <span className="flex-1 text-center text-[15px] font-bold tabular-nums tracking-wide text-white">
              {amount} $
            </span>
            <StepButton onClick={() => setAmount((a) => a + 1)}>
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M3.23 0h1.54v3.23H8v1.54H4.77V8H3.23V4.77H0V3.23h3.23z" fill="currentColor" /></svg>
            </StepButton>
          </div>
        </ControlBox>

        <div className="flex items-center px-1 text-[13px]">
          <span className="shrink-0 text-neo-mut">Payout</span>
          <span className="mx-2 mb-0.5 flex-1 border-b border-dashed border-white/10" />
          <span className="shrink-0 text-[16px] font-bold tabular-nums text-amber-300">{payout.toFixed(2)} $</span>
        </div>

        {/* gradient buy / sell */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onTrade('buy', amount, seconds)} className="btn-neo-buy flex items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold transition-all active:scale-[0.97]">
            Buy
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
          <button onClick={() => onTrade('sell', amount, seconds)} className="btn-neo-sell flex items-center justify-center gap-2 rounded-xl py-3.5 text-[15px] font-extrabold transition-all active:scale-[0.97]">
            Sell
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </button>
        </div>

        {message && <p className={`text-center text-[11px] font-medium ${message.ok ? 'text-emerald-300' : 'text-rose-400'}`}>{message.text}</p>}

        <p className="text-center text-[10px] text-neo-mut">{price != null ? `Live · ${asset.label}` : 'Connecting to market…'}</p>
      </div>

      {/* trades drawer */}
      <div className="overflow-hidden rounded-2xl glass-strong">
        <div className="flex items-center justify-between border-b border-white/5 px-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`border-b-2 py-2.5 text-[13px] font-bold transition-colors ${
              activeTab === 'current' ? 'border-sky-400 text-white' : 'border-transparent text-neo-mut'
            }`}
          >
            Trades <span className="font-semibold text-neo-mut">{trades.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1 py-2.5 pl-3 text-[13px] font-bold transition-colors ${
              activeTab === 'history' ? 'text-sky-400' : 'text-neo-mut'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{trades.length}</span>
          </button>
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-7 text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-neo-mut" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9M3 4h18v5l-4.5 2a2 2 0 0 1-1.8 0L12 10.2 9.3 11a2 2 0 0 1-1.8 0L3 9z" />
              </svg>
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-sky-400 opacity-40" />
            </span>
            <p className="text-[12px] leading-relaxed text-neo-mut">
              You don't have a trade history yet.
              <br />
              You can open a trade using the form above.
            </p>
          </div>
        ) : (
          <div className="neo-scroll max-h-44 space-y-1.5 overflow-y-auto p-2">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 text-[12px]">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${t.side === 'buy' ? 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]' : 'bg-rose-400 shadow-[0_0_8px_2px_rgba(255,84,112,0.5)]'}`} />
                  <span className="font-semibold text-neo-text">{t.label}</span>
                  <span className={t.side === 'buy' ? 'uppercase text-emerald-300' : 'uppercase text-rose-400'}>{t.side}</span>
                </span>
                <span className="tabular-nums text-neo-mut">
                  ${t.amount} · {t.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}