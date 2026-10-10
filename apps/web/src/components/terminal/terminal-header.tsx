'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/store';

const Icon = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function TerminalHeader({ status }: { status: 'connecting' | 'live' | 'offline' }) {
  const { user } = useAuth();
  const [bell, setBell] = useState(false);

  const statusColor = status === 'live' ? 'text-qt-up' : status === 'offline' ? 'text-qt-down' : 'text-qt-mut';

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-qt-line bg-qt-panel px-3">
      <button className="grid h-9 w-9 place-items-center rounded-lg text-qt-mut hover:bg-qt-hover hover:text-qt-text" aria-label="Menu">
        <Icon d="M4 6h16M4 12h16M4 18h16" />
      </button>

      <Link href="/" className="flex items-center gap-2 md:hidden">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-qt-accent to-[#00E676]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-6 4 4 8-9" />
            <path d="M15 6h5v5" />
          </svg>
        </span>
        <span className="text-[15px] font-extrabold tracking-[0.16em] text-white">TRADEVIX</span>
        <span className={`qt-live-dot h-1.5 w-1.5 rounded-full bg-current ${statusColor}`} />
      </Link>

      <div className="ml-2 hidden min-w-0 flex-1 items-center xl:flex">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#0a9d4f] bg-gradient-to-r from-[#0fae57] via-[#00E676] to-[#12e07e] px-3 py-2 shadow-[0_8px_26px_-8px_rgba(0,230,118,0.8)]">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-black/25 text-white">
            <Icon d="M5 15l4-8 3 5 3-6 4 9" className="h-3.5 w-3.5" />
          </span>
          <span className="whitespace-nowrap text-[13px] font-semibold text-white">Get a 50% bonus on your deposit!</span>
          <span className="rounded-md bg-white/95 px-2 py-0.5 text-[13px] font-extrabold text-[#0a7a3c]">50%</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="relative">
          <button
            onClick={() => setBell((v) => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-xl border border-qt-line bg-qt-bg text-qt-mut hover:border-qt-accent hover:text-qt-text"
            aria-label="Notifications"
          >
            <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-qt-down px-1 text-[11px] font-bold text-white">3</span>
          </button>
          {bell && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-xl border border-qt-line bg-qt-panel p-3 shadow-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-qt-mut">Notifications</p>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-qt-bg p-2.5">50% deposit bonus is active</div>
                <div className="rounded-lg bg-qt-bg p-2.5">Withdrawal verified successfully</div>
              </div>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 rounded-xl border border-qt-line bg-qt-bg px-3 py-1.5 text-left hover:border-qt-accent">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-qt-accent to-[#00E676] text-xs font-extrabold text-white">
            {user?.name?.[0]?.toUpperCase() ?? 'T'}
          </span>
          <span className="leading-tight">
            <span className="block text-[10px] font-extrabold uppercase tracking-wide text-qt-gold">Demo account</span>
            <span className="block text-[15px] font-bold tabular-nums text-white">$10,000.00</span>
          </span>
          <Icon d="M6 9l6 6 6-6" className="h-4 w-4 text-qt-mut" />
        </button>

        <button className="qt-up-btn hidden rounded-xl px-4 py-2.5 text-sm font-extrabold sm:block">+ Deposit</button>
        <button className="hidden rounded-xl border border-qt-line bg-qt-panel2 px-4 py-2.5 text-sm font-bold text-qt-text hover:bg-qt-hover sm:block">
          Withdrawal
        </button>
      </div>
    </header>
  );
}
