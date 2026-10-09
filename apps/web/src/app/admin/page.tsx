'use client';

import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { dateTime, fmt } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

interface Overview {
  users: number;
  activeUsers: number;
  openOrders: number;
  pendingKyc: number;
  pendingWithdrawals: number;
  revenue: number;
  tradeVolume: number;
  tradeCount: number;
}
interface AdminUser { _id: string; name: string; email: string; role: string; status: string; kycStatus: string; createdAt: string }
interface KycRow { _id: string; userId: string; docType: string; fullName: string; status: string; createdAt: string }
interface Tx { _id: string; type: string; currency: string; amount: string; status: string; createdAt: string }

type Tab = 'users' | 'kyc' | 'transactions';

export default function AdminPage() {
  const authorized = useRequireAuth('admin');
  const [tab, setTab] = useState<Tab>('users');
  const [ov, setOv] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kyc, setKyc] = useState<KycRow[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);

  const load = useCallback(() => {
    api.get<Overview>('/api/admin/overview').then(setOv).catch(() => undefined);
    api.get<{ rows: AdminUser[] }>('/api/admin/users?limit=50').then((d) => setUsers(d.rows)).catch(() => undefined);
    api.get<KycRow[]>('/api/admin/kyc').then(setKyc).catch(() => undefined);
    api.get<Tx[]>('/api/admin/transactions').then(setTxs).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  async function setUserStatus(id: string, status: string) {
    await api.patch(`/api/admin/users/${id}`, { status });
    load();
  }
  async function reviewKyc(id: string, action: 'approve' | 'reject') {
    await api.post(`/api/admin/kyc/${id}/review`, { action });
    load();
  }
  async function reviewTx(id: string, action: 'approve' | 'reject') {
    await api.post(`/api/admin/transactions/${id}/review`, { action });
    load();
  }

  if (!authorized) return <div className="min-h-screen"><Header /><p className="p-10 text-center text-mut">Loading…</p></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Admin overview</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users" value={`${ov?.activeUsers ?? 0} / ${ov?.users ?? 0}`} />
          <Stat label="Open orders" value={String(ov?.openOrders ?? 0)} />
          <Stat label="Trade volume" value={fmt(ov?.tradeVolume ?? 0, 2)} />
          <Stat label="Revenue (fees)" value={fmt(ov?.revenue ?? 0, 2)} />
        </div>

        <div className="mt-4 flex gap-2">
          {(['users', 'kyc', 'transactions'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-brand text-white' : 'text-mut hover:bg-hover'}`}>
              {t}
              {t === 'kyc' && ov?.pendingKyc ? <span className="ml-2 rounded-full bg-hover px-2 text-xs">{ov.pendingKyc}</span> : null}
              {t === 'transactions' && ov?.pendingWithdrawals ? <span className="ml-2 rounded-full bg-hover px-2 text-xs">{ov.pendingWithdrawals}</span> : null}
            </button>
          ))}
        </div>

        <div className="card mt-4 overflow-x-auto">
          {tab === 'users' && (
            <table className="w-full text-sm">
              <thead><Head cols={['Name', 'Email', 'Role', 'Status', 'KYC', 'Joined', 'Actions']} /></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-line/60">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 text-mut">{u.email}</td>
                    <td className="px-3 py-2 capitalize">{u.role}</td>
                    <td className="px-3 py-2">{u.status}</td>
                    <td className="px-3 py-2">{u.kycStatus}</td>
                    <td className="px-3 py-2 text-mut">{dateTime(u.createdAt)}</td>
                    <td className="px-3 py-2">
                      <select className="input !py-1 text-xs" value={u.status} onChange={(e) => setUserStatus(u._id, e.target.value)}>
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                        <option value="banned">banned</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'kyc' && (
            <table className="w-full text-sm">
              <thead><Head cols={['User', 'Doc', 'Name', 'Status', 'Submitted', 'Actions']} /></thead>
              <tbody>
                {kyc.map((k) => (
                  <tr key={k._id} className="border-b border-line/60">
                    <td className="px-3 py-2 text-mut">{k.userId}</td>
                    <td className="px-3 py-2 capitalize">{k.docType}</td>
                    <td className="px-3 py-2">{k.fullName}</td>
                    <td className="px-3 py-2">{k.status}</td>
                    <td className="px-3 py-2 text-mut">{dateTime(k.createdAt)}</td>
                    <td className="px-3 py-2">
                      {k.status === 'pending' && (
                        <span className="flex gap-2">
                          <button className="text-up underline" onClick={() => reviewKyc(k._id, 'approve')}>Approve</button>
                          <button className="text-down underline" onClick={() => reviewKyc(k._id, 'reject')}>Reject</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'transactions' && (
            <table className="w-full text-sm">
              <thead><Head cols={['Type', 'Amount', 'Status', 'Date', 'Actions']} /></thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t._id} className="border-b border-line/60">
                    <td className="px-3 py-2 capitalize">{t.type}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(Number(t.amount), 6)} {t.currency}</td>
                    <td className="px-3 py-2">{t.status}</td>
                    <td className="px-3 py-2 text-mut">{dateTime(t.createdAt)}</td>
                    <td className="px-3 py-2">
                      {t.status === 'pending' && (
                        <span className="flex gap-2">
                          <button className="text-up underline" onClick={() => reviewTx(t._id, 'approve')}>Approve</button>
                          <button className="text-down underline" onClick={() => reviewTx(t._id, 'reject')}>Reject</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

function Head({ cols }: { cols: string[] }) {
  return (
    <tr className="border-b border-line text-left text-xs uppercase text-mut">
      {cols.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}
    </tr>
  );
}
