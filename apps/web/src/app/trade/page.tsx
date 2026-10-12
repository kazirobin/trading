'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
  const [chartMin, setChartMin] = useState(false);
  const [hideChrome, setHideChrome] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const show = (pin: boolean) => {
      setHideChrome(false);
      if (timer) { clearTimeout(timer); timer = null; }
      if (!pin && window.innerWidth < 1024) timer = setTimeout(() => setHideChrome(true), 2000);
    };
    const onEvent = () => show(false);
    const onClick = () => show(true);
    const pas = { passive: true } as AddEventListenerOptions;
    window.addEventListener('mousemove', onEvent, pas);
    window.addEventListener('pointermove', onEvent, pas);
    window.addEventListener('touchstart', onEvent, pas);
    window.addEventListener('touchmove', onEvent, pas);
    window.addEventListener('scroll', onEvent, { capture: true, passive: true });
    window.addEventListener('click', onClick, true);
    show(false);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('mousemove', onEvent);
      window.removeEventListener('pointermove', onEvent);
      window.removeEventListener('touchstart', onEvent);
      window.removeEventListener('touchmove', onEvent);
      window.removeEventListener('scroll', onEvent, true);
      window.removeEventListener('click', onClick, true);
    };
  }, []);

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
    <div className="flex h-dvh w-full flex-col gap-2 overflow-hidden bg-neo-bg p-2 pb-0 font-sans text-neo-text lg:gap-2.5 lg:p-2.5 lg:pb-0">
      <div className={`relative z-30 overflow-hidden transition-all duration-300 ease-out ${hideChrome ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
        <TerminalHeader status={status} onMenu={() => setSbOpen((o) => !o)} sidebarOpen={sbOpen} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-start gap-2 lg:flex-row lg:gap-2.5">
        <TerminalSidebar open={sbOpen} onToggle={() => setSbOpen((o) => !o)} />
        <main ref={mainRef} style={{ overflowAnchor: 'none' }} className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto md:flex-row md:overflow-hidden md:gap-2.5">
          <TerminalRatioBar symbol={symbol} />
          <div className="flex h-[55vh] shrink-0 flex-col md:h-auto md:min-h-0 md:flex-1">
            <TerminalChart symbol={symbol} onSymbolChange={setSymbol} collapsed={chartMin} onToggleCollapse={() => setChartMin((v) => !v)} />
          </div>
          <TerminalActionPanel asset={asset} price={price} trades={trades} message={message} onTrade={onTrade} />
        </main>
      </div>
      <TerminalNavbar hidden={hideChrome} />
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="grid h-screen place-items-center bg-neo-bg text-neo-mut">Loading terminal…</div>}>
      <TerminalInner />
    </Suspense>
  );
}