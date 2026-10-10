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
    <div className="relative rounded-lg border border-qt-line bg-qt-panel px-3 pb-3 pt-4">
      <span className="absolute -top-[7px] left-1/2 -translate-x-1/2 bg-qt-bg px-1.5 text-[9px] font-medium uppercase tracking-wide text-qt-mut">{label}</span>
      {children}
      <button
        type="button"
        className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 bg-qt-bg px-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-qt-accent hover:underline"
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
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-qt-panel2 text-qt-text hover:bg-qt-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Flags({ base, quote }: { base: string; quote: string }) {
  return (
    <span className="flex -space-x-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#4f9dff] to-[#2b6ef0] text-[10px] font-bold text-white ring-2 ring-qt-panel2">
        {base[0]}
      </span>
      <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#ffb347] to-[#e88400] text-[10px] font-bold text-white ring-2 ring-qt-panel2">
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
  const [seconds, setSeconds] = useState(60);
  const [amount, setAmount] = useState(1);

  const payout = +(amount * (1 + asset.payout / 100)).toFixed(2);
  const [base, quote] = asset.label.split('/');

  return (
    <aside className="qt-scroll flex w-full shrink-0 flex-col gap-4 overflow-y-auto p-3 lg:w-[220px] lg:border-l lg:border-qt-line">
      <div className="flex items-center justify-between rounded-lg bg-qt-panel px-3 py-2.5">
        <span className="flex items-center gap-2">
          <Flags base={base} quote={quote ?? base} />
          <span className="text-[13px] font-bold uppercase tracking-wide text-white">
            {asset.label} <span className="text-[9px] font-semibold text-qt-mut">(OTC)</span>
          </span>
        </span>
        <span className="text-[15px] font-bold text-[#dde2ec]">{asset.payout}%</span>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-qt-accent">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          Pending trade
        </span>
        <button
          onClick={() => setPending((v) => !v)}
          role="switch"
          aria-checked={pending}
          aria-label="Pending trade"
          className={`relative h-5 w-9 shrink-0 rounded-full transition ${pending ? 'bg-qt-accent' : 'bg-qt-line'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${pending ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
      </div>

      <ControlBox label="Time" bottom="Switch time">
        <div className="flex items-center gap-2">
          <StepButton onClick={() => setSeconds((s) => Math.max(5, s - 5))}>
            <svg width="8" height="2" viewBox="0 0 8 2"><path d="M8 0v1.54H0V0z" fill="currentColor" /></svg>
          </StepButton>
          <span className="flex-1 text-center text-[17px] font-bold tabular-nums text-qt-text">{fmtDuration(seconds)}</span>
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
          <span className="flex-1 text-center text-[15px] font-bold tabular-nums text-qt-text">
            {amount} $
          </span>
          <StepButton onClick={() => setAmount((a) => a + 1)}>
            <svg width="8" height="8" viewBox="0 0 8 8"><path d="M3.23 0h1.54v3.23H8v1.54H4.77V8H3.23V4.77H0V3.23h3.23z" fill="currentColor" /></svg>
          </StepButton>
        </div>
      </ControlBox>

      <div className="flex items-center px-1 text-[13px]">
        <span className="shrink-0 text-qt-mut">Payout</span>
        <span className="mx-2 mb-0.5 flex-1 border-b border-dashed border-qt-line" />
        <span className="shrink-0 text-[16px] font-bold tabular-nums text-qt-text">{payout.toFixed(2)} $</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onTrade('buy', amount, seconds)} className="qt-up-btn flex items-center justify-center gap-2 rounded-lg py-3.5 text-[15px] font-bold">
          Buy
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button onClick={() => onTrade('sell', amount, seconds)} className="qt-down-btn flex items-center justify-center gap-2 rounded-lg py-3.5 text-[15px] font-bold">
          Sell
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      {message && <p className={`text-center text-[11px] font-medium ${message.ok ? 'text-qt-up' : 'text-qt-down'}`}>{message.text}</p>}

      <div className="mt-1 overflow-hidden rounded-lg border border-qt-line bg-qt-panel">
        <div className="flex items-center gap-1 border-b border-qt-line px-2">
          <button className="border-b-2 border-qt-accent py-2 text-[13px] font-bold text-qt-text">
            Trades <span className="font-semibold text-qt-mut">{trades.length}</span>
          </button>
          <button className="flex items-center gap-1 py-2 pl-3 text-[13px] font-bold text-qt-mut">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>{trades.length}</span>
          </button>
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-7 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-qt-line bg-qt-panel2">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-qt-mut" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9M3 4h18v5l-4.5 2a2 2 0 0 1-1.8 0L12 10.2 9.3 11a2 2 0 0 1-1.8 0L3 9z" />
              </svg>
            </span>
            <p className="text-[12px] leading-relaxed text-qt-mut">
              You don't have a trade history yet.
              <br />
              You can open a trade using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 p-2">
            {trades.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded bg-qt-bg px-3 py-2 text-[12px]">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${t.side === 'buy' ? 'bg-qt-up' : 'bg-qt-down'}`} />
                  <span className="font-semibold text-qt-text">{t.label}</span>
                  <span className="uppercase text-qt-mut">{t.side}</span>
                </span>
                <span className="tabular-nums text-qt-mut">
                  ${t.amount} · {t.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-qt-mut">{price != null ? `Live · ${asset.label}` : 'Connecting to market…'}</p>
    </aside>
  );
}