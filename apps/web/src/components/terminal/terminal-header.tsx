'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import { useAuth } from '@/lib/store';
import type { WalletBalance } from '@/lib/types';

const Icon = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function TerminalHeader({
  status,
  onMenu,
  sidebarOpen,
}: {
  status: 'connecting' | 'live' | 'offline';
  onMenu?: () => void;
  sidebarOpen?: boolean;
}) {
  const { user, logout } = useAuth();
  const [bell, setBell] = useState(false);
  const [bonus, setBonus] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = () =>
      api
        .get<WalletBalance[]>('/api/wallet')
        .then((ws) => {
          if (!alive) return;
          const usdt = ws.find((w) => w.currency === 'USDT');
          setBalance(usdt ? usdt.available + usdt.locked : ws.reduce((s, w) => s + (w.available + w.locked), 0));
        })
        .catch(() => undefined);
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [user]);

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 rounded-2xl glass-strong px-3 lg:px-4">
      {onMenu && !sidebarOpen && (
        <button
          onClick={onMenu}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/5 bg-white/[0.04] text-neo-mut hover:border-sky-400/40 hover:text-white lg:hidden xl:grid"
          aria-label="Show sidebar"
        >
          <Icon d="M4 6h16M4 12h16M4 18h16" className="h-4 w-4" />
        </button>
      )}
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 shadow-[0_0_20px_-4px_rgba(43,153,255,0.8)]">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-6 4 4 8-9" />
            <path d="M15 6h5v5" />
          </svg>
        </span>
        <span className="hidden text-[15px] font-extrabold tracking-wide text-white xl:block">
          Web <span className="text-grad">Trading</span> Platform
        </span>
      </Link>
      <div className="mx-auto hidden min-w-0 flex-1 items-center justify-center xl:flex">
        {bonus && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/30 bg-gradient-to-r from-emerald-500/15 to-teal-500/5 px-3 py-1.5 shadow-[0_0_24px_-8px_rgba(16,185,129,0.7)]">
            <span className="grid h-5 w-5 place-items-center rounded-full text-emerald-300">
              <Icon d="M5 15l4-8 3 5 3-6 4 9" className="h-3.5 w-3.5" />
            </span>
            <span className="whitespace-nowrap text-[13px] font-medium text-emerald-100">
              Get a <b className="font-bold text-white">50% bonus</b> on your deposit!
            </span>
            <span className="rounded bg-emerald-400 px-1.5 py-0.5 text-[11px] font-bold text-black">50%</span>
            <button onClick={() => setBonus(false)} className="grid h-5 w-5 place-items-center rounded text-emerald-100/60 hover:bg-white/10 hover:text-white" aria-label="Close">
              <Icon d="M6 6l12 12M18 6L6 18" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((v) => !v);
              setBell(false);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.04] px-2.5 py-1.5 transition-all hover:border-sky-400/40"
            aria-label="Account menu"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-violet-600 text-xs font-bold text-white shadow-[0_0_14px_-4px_rgba(43,153,255,0.8)]">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'T'}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                {user ? (user.name || 'Account') : 'Demo account'}
              </span>
              <span className="block text-[14px] font-bold tabular-nums text-white">
                ${fmt(balance ?? (user ? 0 : 10000), 2)} {user && balance === null && <span className="text-[10px] font-normal text-neo-mut">…</span>}
              </span>
            </span>
            <Icon d="M6 9l6 6 6-6" className="h-4 w-4 text-neo-mut" />
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                tabIndex={-1}
              />
              <div className="neo-pop absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl glass-strong p-1.5 shadow-2xl">
                {user ? (
                  <>
                    <div className="rounded-lg bg-white/[0.04] px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-neo-mut">{user.email}</p>
                    </div>
                    <Link href="/wallet" onClick={() => setMenuOpen(false)} className="menu-item">Deposit / Withdraw</Link>
                    <Link href="/settings" onClick={() => setMenuOpen(false)} className="menu-item">Account settings</Link>
                    {user.role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} className="menu-item">Admin panel</Link>}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        window.location.href = '/login';
                      }}
                      className="menu-item text-rose-400"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-white/[0.04] px-3 py-2.5">
                      <p className="text-sm font-semibold text-white">Demo account</p>
                      <p className="text-xs text-neo-mut">Log in to trade with real funds</p>
                    </div>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="menu-item">Log in</Link>
                    <Link href="/register" onClick={() => setMenuOpen(false)} className="menu-item">Create account</Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setBell((v) => !v);
              setMenuOpen(false);
            }}
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/5 bg-white/[0.04] text-neo-mut transition-all hover:border-sky-400/40 hover:text-white"
            aria-label="Notifications"
          >
            <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" />
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-500 px-1 text-[10px] font-bold text-white shadow-[0_0_10px_-2px_rgba(43,153,255,0.9)]">1</span>
          </button>
          {bell && (
            <div className="neo-pop absolute right-0 top-[calc(100%+10px)] w-72 rounded-xl glass-strong p-3 shadow-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neo-mut">Notifications</p>
              <div className="space-y-2 text-sm text-neo-text">
                <div className="rounded-lg bg-white/[0.04] p-2.5">50% deposit bonus is active</div>
                <div className="rounded-lg bg-white/[0.04] p-2.5">Withdrawal verified successfully</div>
              </div>
            </div>
          )}
        </div>

        <Link href="/wallet" className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3.5 py-2 text-sm font-bold text-black shadow-[0_6px_18px_-8px_rgba(16,185,129,0.9)] transition-all hover:brightness-110 sm:flex">
          <Icon d="M12 5v14M5 12h14" className="h-4 w-4" />
          Deposit
        </Link>
        <Link href="/wallet" className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-white transition-all hover:border-rose-400/40 hover:bg-white/[0.08] sm:block">
          Withdrawal
        </Link>
      </div>
    </header>
  );
}