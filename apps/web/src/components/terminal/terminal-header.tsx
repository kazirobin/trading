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
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-neo-line bg-neo-hover text-neo-mut hover:text-neo-text lg:hidden xl:grid"
          aria-label="Show sidebar"
        >
          <Icon d="M4 6h16M4 12h16M4 18h16" className="h-4 w-4" />
        </button>
      )}
      <Link href="/" className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-6 4 4 8-9" />
            <path d="M15 6h5v5" />
          </svg>
        </span>
        <span className="hidden text-[15px] font-extrabold tracking-wide text-neo-text xl:block">
          Web <span className="text-sky-500">Trading</span> Platform
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => {
              setBell((v) => !v);
              setMenuOpen(false);
            }}
            className="relative grid h-8 w-8 place-items-center rounded-lg border border-neo-line bg-neo-hover text-neo-mut transition-colors hover:text-neo-text"
            aria-label="Notifications"
          >
            <Icon d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4" className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">1</span>
          </button>
          {bell && (
            <div className="neo-pop absolute right-0 top-[calc(100%+10px)] w-72 rounded-xl bg-neo-panel p-3 border border-neo-line">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-neo-mut">Notifications</p>
              <div className="space-y-2 text-sm text-neo-text">
                <div className="rounded-lg bg-neo-hover p-2.5">50% deposit bonus is active</div>
                <div className="rounded-lg bg-neo-hover p-2.5">Withdrawal verified successfully</div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((v) => !v);
              setBell(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-neo-line bg-neo-hover px-2.5 py-1.5 transition-colors"
            aria-label="Account menu"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sky-500 text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'T'}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-500">
                {user ? (user.name || 'Account') : 'Demo account'}
              </span>
              <span className="block text-[14px] font-bold tabular-nums text-neo-text">
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
              <div className="neo-pop absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl bg-neo-panel p-1.5 border border-neo-line">
                {user ? (
                  <>
                    <div className="rounded-lg bg-neo-hover px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-neo-text">{user.name}</p>
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
                      className="menu-item text-rose-500"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-neo-hover px-3 py-2.5">
                      <p className="text-sm font-semibold text-neo-text">Demo account</p>
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

        <Link href="/wallet" className="hidden items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-emerald-400 sm:flex">
          <Icon d="M12 5v14M5 12h14" className="h-4 w-4" />
          Deposit
        </Link>
      </div>
    </header>
  );
}