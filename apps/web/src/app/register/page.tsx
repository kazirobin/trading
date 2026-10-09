'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/header';
import { useAuth } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="card p-6">
          <h1 className="text-xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-mut">Start trading in minutes.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            {error && <p className="text-sm text-down">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Sign up'}
            </button>
          </form>
          <p className="mt-4 text-sm text-mut">
            Already registered?{' '}
            <Link href="/login" className="text-brand-light">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
