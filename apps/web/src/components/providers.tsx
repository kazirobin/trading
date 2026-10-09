'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth, useMarket } from '@/lib/store';
import type { MarketPair } from '@/lib/types';

export function Providers({ children }: { children: React.ReactNode }) {
  const loadMe = useAuth((s) => s.loadMe);
  const setPairs = useMarket((s) => s.setPairs);
  const setPrice = useMarket((s) => s.setPrice);

  useEffect(() => {
    void loadMe();
    api
      .get<MarketPair[]>('/api/markets')
      .then(setPairs)
      .catch(() => undefined);

    const socket = getSocket();
    const onPrice = (p: { symbol: string; price: string }) => setPrice(p.symbol, Number(p.price));
    socket.on('price', onPrice);
    return () => {
      socket.off('price', onPrice);
    };
  }, [loadMe, setPairs, setPrice]);

  return <>{children}</>;
}
