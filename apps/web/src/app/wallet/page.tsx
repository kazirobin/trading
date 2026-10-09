'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { dateTime, fmt } from '@/lib/format';
import { useAuth } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';
import type { Transaction, WalletBalance } from '@/lib/types';

export default function WalletPage() {
  const authorized = useRequireAuth();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [dep, setDep] = useState({ currency: 'USDT', amount: '' });
  const [wd, setWd] = useState({ currency: 'USDT', amount: '', address: '', totp: '' });

  const load = useCallback(() => {
    api.get<WalletBalance[]>('/api/wallet').then(setWallets).catch(() => undefined);
    api.get<Transaction[]>('/api/wallet/transactions?limit=50').then(setTxs).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  async function deposit() {
    setMsg(null);
    try {
      await api.post('/api/wallet/deposit', { currency: dep.currency, amount: Number(dep.amount), method: 'manual' });
      setMsg({ ok: true, text: 'Deposit request submitted — pending admin approval.' });
      setDep({ ...dep, amount: '' });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  async function withdraw() {
    setMsg(null);
    try {
      await api.post('/api/wallet/withdraw', {
        currency: wd.currency,
        amount: Number(wd.amount),
        address: wd.address,
        totp: wd.totp || '000000',
      });
      setMsg({ ok: true, text: 'Withdrawal submitted — pending admin approval.' });
      setWd({ ...wd, amount: '', address: '', totp: '' });
      load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  if (!authorized) return <div className="min-h-screen"><Header /><p className="p-10 text-center text-mut">Loading…</p></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Wallet</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {wallets.map((w) => (
            <div key={w.currency} className="card p-4">
              <p className="text-sm text-mut">{w.currency}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{fmt(w.available, 8)}</p>
              <p className="text-xs text-mut">locked {fmt(w.locked, 8)}</p>
            </div>
          ))}
        </div>

        {msg && <p className={`mt-4 text-sm ${msg.ok ? 'text-up' : 'text-down'}`}>{msg.text}</p>}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="font-semibold">Deposit</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Currency</label>
                <select className="input" value={dep.currency} onChange={(e) => setDep({ ...dep, currency: e.target.value })}>
                  {['USDT', 'USD', 'BTC', 'ETH'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input className="input" inputMode="decimal" value={dep.amount} onChange={(e) => setDep({ ...dep, amount: e.target.value })} />
              </div>
            </div>
            <button className="btn-primary mt-4 w-full" onClick={deposit} disabled={!dep.amount}>Request deposit</button>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold">Withdraw</h2>
            {user?.kycStatus !== 'approved' && <p className="mt-1 text-sm text-warn">KYC approval required to withdraw.</p>}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Currency</label>
                <select className="input" value={wd.currency} onChange={(e) => setWd({ ...wd, currency: e.target.value })}>
                  {['USDT', 'USD', 'BTC', 'ETH'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Amount</label>
                <input className="input" inputMode="decimal" value={wd.amount} onChange={(e) => setWd({ ...wd, amount: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" value={wd.address} onChange={(e) => setWd({ ...wd, address: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">2FA code (if enabled)</label>
                <input className="input" value={wd.totp} onChange={(e) => setWd({ ...wd, totp: e.target.value })} placeholder="000000" />
              </div>
            </div>
            <button className="btn-down mt-4 w-full" onClick={withdraw} disabled={!wd.amount || !wd.address}>Request withdrawal</button>
          </div>
        </div>

        <div className="card mt-6 overflow-x-auto">
          <h2 className="p-4 font-semibold">Transaction history</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs uppercase text-mut">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t._id} className="border-b border-line/60">
                  <td className="px-4 py-2 text-mut">{dateTime(t.createdAt)}</td>
                  <td className="px-4 py-2 capitalize">{t.type}</td>
                  <td className="px-4 py-2 tabular-nums">{fmt(Number(t.amount), 6)} {t.currency}</td>
                  <td className={`px-4 py-2 ${t.status === 'pending' ? 'text-warn' : t.status === 'completed' ? 'text-up' : 'text-down'}`}>{t.status}</td>
                  <td className="px-4 py-2 text-mut">{t.note}</td>
                </tr>
              ))}
              {txs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-mut">No transactions</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
