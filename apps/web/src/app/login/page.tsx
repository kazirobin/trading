'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/store';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, verify2fa } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const next = params.get('next') || '/dashboard';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tempToken) {
        await verify2fa(tempToken, totp);
        router.push(next);
        return;
      }
      const res = await login(email, password, totp || undefined);
      if (res.twoFactorRequired) {
        setTempToken(res.tempToken ?? '');
      } else {
        router.push(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="card p-6">
          <h1 className="text-xl font-bold">Log in</h1>
          <p className="mt-1 text-sm text-mut">Welcome back to Tradevix.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {!tempToken ? (
              <>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </>
            ) : (
              <div>
                <label className="label">2FA code</label>
                <input className="input" inputMode="numeric" value={totp} onChange={(e) => setTotp(e.target.value)} placeholder="6-digit code" required />
              </div>
            )}
            {error && <p className="text-sm text-down">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Please wait…' : tempToken ? 'Verify' : 'Log in'}
            </button>
          </form>
          <p className="mt-4 text-sm text-mut">
            No account?{' '}
            <Link href="/register" className="text-brand-light">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-mut">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
