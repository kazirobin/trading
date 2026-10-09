'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/markets', label: 'Markets' },
  { href: '/trade', label: 'Trade' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/wallet', label: 'Wallet' },
];

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="h-16 border-b border-line bg-card">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-light">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth={2.5}>
              <path d="M3 17l5-6 4 4 8-9" />
              <path d="M15 6h5v5" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-widest">TRADEVIX</span>
            <span className="block text-[11px] text-mut">Trading Platform</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm text-mut hover:bg-hover hover:text-txt">
              {l.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-sm text-warn hover:bg-hover">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/wallet" className="hidden text-sm text-mut sm:block">
                {user.name}
              </Link>
              <button
                className="btn-ghost"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
