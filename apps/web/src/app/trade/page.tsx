'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TerminalHeader } from '@/components/terminal/terminal-header';
import { TerminalSidebar } from '@/components/terminal/terminal-sidebar';
import { TerminalChart } from '@/components/terminal/terminal-chart';
import { TerminalActionPanel, type TerminalTrade } from '@/components/terminal/terminal-action-panel';
import { TerminalNavbar } from '@/components/terminal/terminal-navbar';
import { TerminalRatioBar } from '@/components/terminal/terminal-ratio-bar';
import { api } from '@/lib/api';
import { assetOf, useBinanceTickers } from '@/lib/binance';
import { useAuth } from '@/lib/store';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function TerminalInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = useAuth();
  const { tickers, status } = useBinanceTickers();

  const symbol = (params.get('symbol') || 'BTCUSDT').toUpperCase();
  const asset = assetOf(symbol);
  const price = tickers[symbol]?.c ?? null;

  const [trades, setTrades] = useState<TerminalTrade[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [sbOpen, setSbOpen] = useState(true);

  const setSymbol = useCallback(
    (s: string) => {
      const current = params.get('symbol') || 'BTCUSDT';
      if (s !== current) router.replace(`/trade?symbol=${s}`, { scroll: false });
    },
    [params, router],
  );

  useEffect(() => {
    if (!token) return;
    api
      .get<{ _id: string; symbol: string; side: 'buy' | 'sell'; amount: string }[]>('/api/orders?status=open')
      .then((rows) =>
        setTrades(
          rows.slice(0, 20).map((o) => ({
            id: o._id,
            label: assetOf(o.symbol).label,
            side: o.side,
            amount: Number(o.amount),
            time: '',
          })),
        ),
      )
      .catch(() => undefined);
  }, [token]);

  const onTrade = useCallback(
    async (side: 'buy' | 'sell', amount: number, seconds: number) => {
      setMessage(null);
      if (!token) {
        setMessage({ ok: false, text: 'Signing in required — routing to login…' });
        router.push(`/login?next=/trade${symbol !== 'BTCUSDT' ? `?symbol=${symbol}` : ''}`);
        return;
      }
      if (!price) {
        setMessage({ ok: false, text: 'Waiting for market price…' });
        return;
      }
      try {
        const qty = +(amount / price).toFixed(6);
        await api.post('/api/orders', { symbol, side, type: 'market', amount: qty });
        const d = new Date();
        setTrades((prev) => [
          {
            id: `${Date.now()}`,
            label: asset.label,
            side,
            amount,
            time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
          },
          ...prev,
        ]);
        setMessage({ ok: true, text: `${side === 'buy' ? 'Buy' : 'Sell'} placed · $${amount} · ${seconds}s` });
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : 'Order failed' });
      }
    },
    [token, price, symbol, asset.label, router],
  );

  return (
    <div className="qt-shell flex h-dvh w-full flex-col overflow-hidden font-sans text-qt-text">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TerminalSidebar open={sbOpen} onToggle={() => setSbOpen((o) => !o)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TerminalHeader status={status} onMenu={() => setSbOpen((o) => !o)} sidebarOpen={sbOpen} />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
            <TerminalRatioBar symbol={symbol} />
            <div className="flex h-[56vh] min-h-[340px] flex-col lg:h-auto lg:min-h-0 lg:flex-1">
              <TerminalChart symbol={symbol} onSymbolChange={setSymbol} />
            </div>
            <TerminalActionPanel asset={asset} price={price} trades={trades} message={message} onTrade={onTrade} />
          </main>
        </div>
      </div>
      <TerminalNavbar />
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="grid h-screen place-items-center bg-qt-bg text-qt-mut">Loading terminal…</div>}>
      <TerminalInner />
    </Suspense>
  );
}