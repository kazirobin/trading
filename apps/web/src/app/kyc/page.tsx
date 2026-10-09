'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function KycPage() {
  const authorized = useRequireAuth();
  const [status, setStatus] = useState<string>('unverified');
  const [form, setForm] = useState({
    docType: 'nid',
    docNumber: '',
    fullName: '',
    country: '',
    frontImage: '',
    selfie: '',
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!authorized) return;
    api.get<{ status: string }>('/api/kyc/me').then((d) => setStatus(d.status)).catch(() => undefined);
  }, [authorized]);

  async function submit() {
    setMsg(null);
    try {
      await api.post('/api/kyc', form);
      setStatus('pending');
      setMsg({ ok: true, text: 'Submitted for review.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed' });
    }
  }

  if (!authorized) return <div className="min-h-screen"><Header /><p className="p-10 text-center text-mut">Loading…</p></div>;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">KYC verification</h1>
        <p className="mt-1 text-sm text-mut">
          Current status:{' '}
          <span className={status === 'approved' ? 'text-up' : status === 'rejected' ? 'text-down' : 'text-warn'}>{status}</span>
        </p>

        <div className="card mt-6 space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Document type</label>
              <select className="input" value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })}>
                <option value="nid">National ID</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving license</option>
              </select>
            </div>
            <div>
              <label className="label">Document number</label>
              <input className="input" value={form.docNumber} onChange={(e) => setForm({ ...form, docNumber: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Full name (as on document)</label>
            <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div>
            <label className="label">Country</label>
            <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label className="label">Document front image URL</label>
            <input className="input" placeholder="https://…" value={form.frontImage} onChange={(e) => setForm({ ...form, frontImage: e.target.value })} />
          </div>
          <div>
            <label className="label">Selfie image URL</label>
            <input className="input" placeholder="https://…" value={form.selfie} onChange={(e) => setForm({ ...form, selfie: e.target.value })} />
          </div>
          <p className="text-xs text-mut">Demo stores image URLs as text. In production, upload to object storage (S3) instead.</p>
          {msg && <p className={`text-sm ${msg.ok ? 'text-up' : 'text-down'}`}>{msg.text}</p>}
          <button className="btn-primary w-full" onClick={submit} disabled={!form.docNumber || !form.fullName || !form.frontImage || !form.selfie}>
            Submit for verification
          </button>
        </div>
      </main>
    </div>
  );
}
