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
  const [bonus, setBonus] = useState(true);

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-qt-line bg-qt-bg px-3 lg:px-4">
      <div className="mx-auto hidden min-w-0 flex-1 items-center justify-center xl:flex">
        {bonus && (
          <div className="flex items-center gap-2.5 rounded-lg bg-gradient-to-r from-[#0FAF59] to-[#12c963] px-3 py-1.5 shadow-[0_6px_20px_-8px_rgba(15,175,89,0.9)]">
            <span className="grid h-5 w-5 place-items-center rounded-full text-white">
              <Icon d="M5 15l4-8 3 5 3-6 4 9" className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap text-[13px] font-medium text-white">
              Get a <b className="font-bold">50% bonus</b> on your deposit!
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-bold text-[#0b8a46]">50%</span>
            <button onClick={() => setBonus(false)} className="grid h-5 w-5 place-items-center rounded text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">
              <Icon d="M6 6l12 12M18 6L6 18" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link href="/settings" className="flex items-center gap-2 rounded-lg border border-qt-line bg-qt-panel px-2.5 py-1.5 hover:border-qt-accent">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-qt-accent to-[#0FAF59] text-xs font-bold text-white">
            {user?.name?.[0]?.toUpperCase() ?? 'T'}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-qt-gold">Demo account</span>
            <span className="block text-[14px] font-bold tabular-nums text-qt-text">$10,000.00</span>
          </span>
          <Icon d="M6 9l6 6 6-6" className="h-4 w-4 text-qt-mut" />
        </Link>

        <div className="relative">
          <button
            onClick={() => setBell((v) => !v)}
            className="relative grid h-9 w-9 place-items-center rounded-lg border border-qt-line bg-qt-panel text-qt-mut hover:border-qt-accent hover:text-qt-text"
            aria-label="Notifications"
          >
            <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-qt-accent px-1 text-[10px] font-bold text-white">1</span>
          </button>
          {bell && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-72 rounded-lg border border-qt-line bg-qt-panel p-3 shadow-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-qt-mut">Notifications</p>
              <div className="space-y-2 text-sm text-qt-text">
                <div className="rounded bg-qt-bg p-2.5">50% deposit bonus is active</div>
                <div className="rounded bg-qt-bg p-2.5">Withdrawal verified successfully</div>
              </div>
            </div>
          )}
        </div>

        <Link href="/wallet" className="qt-up-btn hidden items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold sm:flex">
          <Icon d="M12 5v14M5 12h14" className="h-4 w-4" />
          Deposit
        </Link>
        <Link href="/wallet" className="hidden rounded-lg border border-qt-line bg-qt-panel px-3.5 py-2 text-sm font-semibold text-qt-text hover:bg-qt-hover sm:block">
          Withdrawal
        </Link>
      </div>
    </header>
  );
}
