'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function SettingsPage() {
  const authorized = useRequireAuth();
  const { user, loadMe } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [totp, setTotp] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (authorized) void loadMe();
  }, [authorized, loadMe]);

  async function startSetup() {
    setMsg(null);
    try {
      const data = await api.post<{ secret: string; qr: string }>('/api/auth/2fa/setup');
      setSetup(data);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  async function enable() {
    setMsg(null);
    try {
      await api.post('/api/auth/2fa/enable', { totp });
      setMsg({ ok: true, text: '2FA enabled.' });
      setSetup(null);
      setTotp('');
      void loadMe();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  async function disable() {
    setMsg(null);
    try {
      await api.post('/api/auth/2fa/disable', { totp });
      setMsg({ ok: true, text: '2FA disabled.' });
      setTotp('');
      void loadMe();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  if (!authorized) return <div className="min-h-screen"><Header /><p className="p-10 text-center text-mut">Loading…</p></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Profile &amp; settings</h1>

        <div className="card mt-6 p-5">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-mut">Name</dt><dd>{user?.name}</dd></div>
            <div className="flex justify-between"><dt className="text-mut">Email</dt><dd>{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-mut">Role</dt><dd className="capitalize">{user?.role}</dd></div>
            <div className="flex justify-between"><dt className="text-mut">KYC</dt><dd>{user?.kycStatus}</dd></div>
          </dl>
        </div>

        <div className="card mt-4 p-5">
          <h2 className="font-semibold">Two-factor authentication (2FA)</h2>
          <p className="mt-1 text-sm text-mut">Status: {user?.twoFAEnabled ? 'enabled' : 'disabled'}</p>

          {!user?.twoFAEnabled && !setup && (
            <button className="btn-primary mt-3" onClick={startSetup}>Set up 2FA</button>
          )}

          {setup && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qr} alt="2FA QR" className="h-44 w-44 rounded-lg bg-white p-2" />
              <p className="mt-2 text-xs text-mut">Secret: {setup.secret}</p>
              <div className="mt-3 flex gap-2">
                <input className="input" placeholder="6-digit code" value={totp} onChange={(e) => setTotp(e.target.value)} />
                <button className="btn-primary" onClick={enable}>Enable</button>
              </div>
            </div>
          )}

          {user?.twoFAEnabled && (
            <div className="mt-3 flex gap-2">
              <input className="input" placeholder="6-digit code" value={totp} onChange={(e) => setTotp(e.target.value)} />
              <button className="btn-down" onClick={disable}>Disable</button>
            </div>
          )}

          {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-up' : 'text-down'}`}>{msg.text}</p>}
        </div>
      </main>
    </div>
  );
}
