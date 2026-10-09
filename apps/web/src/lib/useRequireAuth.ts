'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './store';

export function useRequireAuth(role?: 'admin'): boolean {
  const router = useRouter();
  const { user, ready, token } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (role === 'admin' && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [ready, token, user, role, router]);

  return Boolean(token && user && (!role || user.role === role));
}
