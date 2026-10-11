'use client';

import Link from 'next/link';
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

const coinColor = (base: string) =>
  ({
    BTC: '#f7931a',
    ETH: '#627eea',
    BNB: '#f3ba2f',
    XRP: '#20273f',
    SOL: '#9945ff',
    ADA: '#0033ad',
    DOGE: '#c2a633',
    USDT: '#26a17b',
    EUR: '#2064f0',
  })[base] ?? '#3b82f6';

function CoinIcon({ base, size = 9, bg, fg = '#fff' }: { base: string; size?: number; bg: string; fg?: string }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-[12px] font-extrabold"
      style={{ width: size * 4, height: size * 4, background: bg, color: fg }}
    >
      {base[0]}
    </span>
  );
}

function USFlag() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full ring-2 ring-white/10">
      <svg viewBox="0 0 24 24" className="h-full w-full">
        <rect width="24" height="24" fill="#f2f2f2" />
        <rect width="24" height="1.85" y="0" fill="#b22234" />
        <rect width="24" height="1.85" y="3.7" fill="#b22234" />
        <rect width="24" height="1.85" y="7.4" fill="#b22234" />
        <rect width="24" height="1.85" y="11.1" fill="#b22234" />
        <rect width="24" height="1.85" y="14.8" fill="#b22234" />
        <rect width="24" height="1.85" y="18.5" fill="#b22234" />
        <rect width="24" height="1.85" y="22.2" fill="#b22234" />
        <rect width="10" height="13" fill="#3c3b6e" />
      </svg>
    </span>
  );
}

function SquareStep({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-neo-text transition-all hover:border-sky-400/40 hover:bg-white/[0.09] disabled:opacity-40"
    >
      {children}
    </button>
  );
}

const sampleRows = [
  { label: 'BTC/USD', color: '#f7931a', letter: 'B', dir: 'up', amt: '$10.00', spent: '$10.00', result: '+ $8.20', elapsedTime: '00:01:00' },
  { label: 'ETH/USD', color: '#627eea', letter: 'E', dir: 'down', amt: '$10.00', spent: '$10.00', result: '+ $8.10', elapsedTime: '00:01:00' },
  { label: 'EUR/USD', color: '#2064f0', letter: 'E', dir: 'up', amt: '$10.00', spent: '$10.01', result: '+ $7.50', elapsedTime: '00:01:00' },
] as const;

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
  const base = (asset.label.split('/') ?? [asset.label])[0] ?? asset.label;

  return (
    <aside className="neo-scroll flex w-full shrink-0 flex-col gap-2.5 overflow-y-auto rounded-2xl border border-white/[0.05] bg-[#0b0e17] p-2.5 md:w-[300px] md:shrink-0">
      {/* main trade card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#131722] p-3">
        {/* asset header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <CoinIcon base={base} bg={coinColor(base)} />
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-white">{asset.label}</span>
              <span className="text-[11px] font-medium text-neo-mut">{asset.payout}%</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-[15px] font-bold tabular-nums text-amber-300">
            {asset.payout}%
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>

        {/* time box */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0f131d] p-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-neo-mut">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Time
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-neo-mut">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 12l3.5-3.5" />
                </svg>
              </span>
              <span className="text-[16px] font-bold tabular-nums tracking-wide text-white">{fmtDuration(seconds)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <SquareStep onClick={() => setSeconds((s) => Math.max(5, s - 5))}>
                <svg width="9" height="2" viewBox="0 0 9 2"><path d="M9 0v1.6H0V0z" fill="currentColor" /></svg>
              </SquareStep>
              <SquareStep onClick={() => setSeconds((s) => Math.min(14400, s + 5))}>
                <svg width="9" height="9" viewBox="0 0 9 9"><path d="M3.6 0h1.8v3.6H9v1.8H5.4V9H3.6V5.4H0V3.6h3.6z" fill="currentColor" /></svg>
              </SquareStep>
            </span>
          </div>
        </div>

        {/* investment box */}
        <div className="rounded-xl border border-white/[0.06] bg-[#0f131d] p-2.5">
          <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-neo-mut">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M9.5 8.5h5M9.5 12h5M9.5 15.5h5" />
            </svg>
            $ Investment
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-neo-mut">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M9.5 8.5h5M9.5 12h5M9.5 15.5h5" />
                </svg>
              </span>
              <span className="text-[16px] font-bold tabular-nums tracking-wide text-white">
                $ {amount}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <SquareStep disabled={amount <= 1} onClick={() => setAmount((a) => Math.max(1, a - 1))}>
                <svg width="9" height="2" viewBox="0 0 9 2"><path d="M9 0v1.6H0V0z" fill="currentColor" /></svg>
              </SquareStep>
              <SquareStep onClick={() => setAmount((a) => a + 1)}>
                <svg width="9" height="9" viewBox="0 0 9 9"><path d="M3.6 0h1.8v3.6H9v1.8H5.4V9H3.6V5.4H0V3.6h3.6z" fill="currentColor" /></svg>
              </SquareStep>
            </span>
          </div>
        </div>

        {/* payout info */}
        <div className="flex items-end justify-between px-0.5">
          <span className="flex flex-col leading-tight">
            <span className="text-[12px] font-medium text-white">Payout</span>
            <span className="text-[13px] font-semibold tabular-nums text-emerald-400">${payout.toFixed(2)}</span>
          </span>
          <span className="text-[24px] font-extrabold leading-none tabular-nums text-emerald-400">{asset.payout}%</span>
        </div>

        {/* action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTrade('buy', amount, seconds)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#10b981] py-3 text-[15px] font-extrabold text-white transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            UP
          </button>
          <button
            onClick={() => onTrade('sell', amount, seconds)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#ef4444] py-3 text-[15px] font-extrabold text-white transition-all hover:brightness-110 active:scale-[0.97]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            DOWN
          </button>
        </div>

        {message && <p className={`text-center text-[11px] font-medium ${message.ok ? 'text-emerald-300' : 'text-rose-400'}`}>{message.text}</p>}
        <p className="text-center text-[10px] text-neo-mut">{price != null ? `Live · ${asset.label}` : 'Connecting to market…'}</p>
      </div>

      {/* recent trades card */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.06] bg-[#131722] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-white">Recent Trades</span>
          <Link href="/trade" className="text-[11.5px] font-semibold text-sky-400 hover:underline">
            View All
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {trades.length === 0
            ? sampleRows.map((row) => <TradeRow key={row.label} icon={<CoinIcon base={row.label} bg={row.color} size={10} />} label={row.label} dir={row.dir} time={row.elapsedTime} amt={row.amt} spent={row.spent} result={row.result} />)
            : trades.map((t) => {
                const [b] = t.label.split('/');
                const win = +(t.amount * (1 + asset.payout / 100)).toFixed(2);
                return (
                  <TradeRow
                    key={t.id}
                    icon={<CoinIcon base={b} bg={coinColor(b)} size={10} />}
                    label={t.label}
                    dir={t.side === 'buy' ? 'up' : 'down'}
                    time={t.time}
                    amt={`$${t.amount.toFixed(2)}`}
                    spent={`$${t.amount.toFixed(2)}`}
                    result={`+ $${win.toFixed(2)}`}
                  />
                );
              })}
          {pending && (
            <span className="text-center text-[9px] font-medium uppercase tracking-wide text-neo-mut">Pending trade enabled</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function TradeRow({
  icon,
  label,
  dir,
  time,
  amt,
  spent,
  result,
}: {
  icon: React.ReactNode;
  label: string;
  dir: 'up' | 'down';
  time: string;
  amt: string;
  spent: string;
  result: string;
}) {
  const up = dir === 'up';
  return (
  <div className="flex w-full items-center justify-between rounded-xl bg-white/[0.02] px-3 py-3 sm:px-5 sm:py-3.5">
  
  {/* ১. বাম পাশ: আইকন, লেবেল, তীর চিহ্ন ও টাইম */}
  <div className="flex items-center gap-3 sm:gap-4">
    <div className="shrink-0">
      {icon}
    </div>
    <div className="flex flex-col gap-0.5 leading-tight">
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-bold text-white sm:text-[14px]">
          {label}
        </span>
        <svg 
          viewBox="0 0 24 24" 
          className={`h-3 w-3 shrink-0 ${up ? 'text-emerald-400' : 'text-rose-400'}`} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={2.6} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {up ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
        </svg>
      </div>
      <span className="text-[11px] tabular-nums text-[#848E9C] sm:text-[12px]">
        {time}
      </span>
    </div>
  </div>

  {/* ২. ডেস্কটপ ও মোবাইলের জন্য মাঝের বা মূল অ্যামাউন্ট ($10.00) */}
  <div className="text-center">
    <span className="text-[13px] font-semibold tabular-nums text-white sm:text-[14px]">
      {amt}
    </span>
  </div>

  {/* ৩. ডান পাশ: উপরে মূল অ্যামাউন্ট (ম্লান রঙে) এবং নিচে প্রফিট রেজাল্ট (+ $8.20) */}
  <div className="flex flex-col items-end leading-tight">
    <span className="text-[10px] tabular-nums text-[#848E9C] sm:text-[11px]">
      {spent}
    </span>
    <span className="text-[12px] font-bold tabular-nums text-emerald-400 sm:text-[13px]">
      {result}
    </span>
  </div>

</div>
  );
}