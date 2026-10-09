'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { fmt } from '@/lib/format';
import { useAuth } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import type { TradeDto, Transaction, WalletBalance } from '@/lib/types';

export default function DashboardPage() {
  const authorized = useRequireAuth();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [trades, setTrades] = useState<TradeDto[]>([]);

  useEffect(() => {
    if (!authorized) return;
    api.get<WalletBalance[]>('/api/wallet').then(setWallets).catch(() => undefined);
    api.get<Transaction[]>('/api/wallet/transactions?limit=8').then(setTxs).catch(() => undefined);
    api.get<TradeDto[]>('/api/trades?limit=6').then(setTrades).catch(() => undefined);
  }, [authorized]);

  if (!authorized) return <div className="min-h-screen"><Header /><p className="p-10 text-center text-mut">Loading…</p></div>;

  const usdt = wallets.find((w) => w.currency === 'USDT');

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
            <p className="text-sm text-mut">
              KYC: <span className="text-txt">{user?.kycStatus}</span> · 2FA: <span className="text-txt">{user?.twoFAEnabled ? 'on' : 'off'}</span>
            </p>
          </div>
          <Link href="/trade" className="btn-primary">Trade now</Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="USDT available" value={usdt ? fmt(usdt.available, 2) : '0.00'} />
          <Stat label="USDT locked" value={usdt ? fmt(usdt.locked, 2) : '0.00'} />
          <Stat label="Wallet assets" value={String(wallets.length)} />
          <Stat label="Recent trades" value={String(trades.length)} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-4">
            <h2 className="mb-3 font-semibold">Balances</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-mut">
                  <th className="py-2">Asset</th>
                  <th className="py-2 text-right">Available</th>
                  <th className="py-2 text-right">Locked</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.currency} className="border-t border-line">
                    <td className="py-2 font-semibold">{w.currency}</td>
                    <td className="py-2 text-right tabular-nums">{fmt(w.available, 8)}</td>
                    <td className="py-2 text-right tabular-nums text-mut">{fmt(w.locked, 8)}</td>
                  </tr>
                ))}
                {wallets.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-mut">No wallets</td></tr>}
              </tbody>
            </table>
            <Link href="/wallet" className="btn-ghost mt-4 w-full">Manage funds</Link>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 font-semibold">Recent activity</h2>
            <ul className="space-y-2 text-sm">
              {txs.map((t) => (
                <li key={t._id} className="flex justify-between border-b border-line pb-2">
                  <span className="capitalize text-mut">{t.type}</span>
                  <span className="tabular-nums">
                    {fmt(Number(t.amount), 6)} {t.currency}
                  </span>
                  <span className={t.status === 'pending' ? 'text-warn' : t.status === 'completed' ? 'text-up' : 'text-down'}>{t.status}</span>
                </li>
              ))}
              {txs.length === 0 && <li className="py-4 text-center text-mut">No transactions</li>}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-mut">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
