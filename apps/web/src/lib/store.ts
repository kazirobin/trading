'use client';

import { create } from 'zustand';
import { ACCESS_KEY, REFRESH_KEY, api } from './api';
import type { MarketPair, User } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (access: string, refresh?: string) => void;
  login: (email: string, password: string, totp?: string) => Promise<{ twoFactorRequired?: boolean; tempToken?: string }>;
  verify2fa: (tempToken: string, totp: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadMe: () => Promise<void>;
}

function storeSession(access: string, refresh?: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? window.localStorage.getItem(ACCESS_KEY) : null,
  ready: false,

  setSession: (access, refresh) => {
    storeSession(access, refresh);
    set({ token: access });
  },

  login: async (email, password, totp) => {
    const data = await api.post<{ user?: User; accessToken?: string; refreshToken?: string; twoFactorRequired?: boolean; tempToken?: string }>(
      '/api/auth/login',
      { email, password, totp },
    );
    if (data.twoFactorRequired) return { twoFactorRequired: true, tempToken: data.tempToken };
    storeSession(data.accessToken as string, data.refreshToken);
    set({ user: data.user ?? null, token: data.accessToken as string });
    return {};
  },

  verify2fa: async (tempToken, totp) => {
    const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/2fa/verify', { tempToken, totp });
    storeSession(data.accessToken, data.refreshToken);
    set({ user: data.user, token: data.accessToken });
  },

  register: async (name, email, password) => {
    const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/api/auth/register', { name, email, password });
    storeSession(data.accessToken, data.refreshToken);
    set({ user: data.user, token: data.accessToken });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
    set({ user: null, token: null });
  },

  loadMe: async () => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(ACCESS_KEY) : null;
    if (!token) {
      set({ ready: true });
      return;
    }
    try {
      const user = await api.get<User>('/api/auth/me');
      set({ user, token, ready: true });
    } catch {
      set({ user: null, token: null, ready: true });
    }
  },
}));

interface MarketState {
  pairs: MarketPair[];
  prices: Record<string, number>;
  setPairs: (pairs: MarketPair[]) => void;
  setPrice: (symbol: string, price: number) => void;
}

export const useMarket = create<MarketState>((set) => ({
  pairs: [],
  prices: {},
  setPairs: (pairs) => {
    const prices: Record<string, number> = {};
    for (const p of pairs) prices[p.symbol] = Number(p.lastPrice);
    set((s) => ({ pairs, prices: { ...s.prices, ...prices } }));
  },
  setPrice: (symbol, price) => set((s) => ({ prices: { ...s.prices, [symbol]: price } })),
}));
