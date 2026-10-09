'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { useMarket } from '@/lib/store';
import { fmt, pdec } from '@/lib/format';

const features = [
  { title: 'Real-time charts', body: 'Candlestick charting powered by TradingView Lightweight Charts with live Binance prices.' },
  { title: 'Deep order book', body: 'Aggregated bids and asks with instant fill notifications over WebSockets.' },
  { title: 'Multiple order types', body: 'Market, limit, stop-limit and stop-market orders with maker/taker fees.' },
  { title: 'Secure wallet', body: 'Locked/available balances, deposits, withdrawals with KYC and 2FA.' },
];

export default function HomePage() {
  const { pairs, prices } = useMarket();
  const top = pairs.slice(0, 6);

  return (
    <div className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="tag bg-hover text-info">Live crypto markets · 24/7</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
              Trade crypto with a <span className="text-brand-light">pro-grade</span> terminal
            </h1>
            <p className="mt-4 max-w-lg text-mut">
              Real order matching, live charts, order book depth and a secure wallet — all in one platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trade" className="btn-primary px-6 py-3">
                Open terminal
              </Link>
              <Link href="/register" className="btn-ghost px-6 py-3">
                Create account
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-mut">Live markets</h3>
            <div className="space-y-2">
              {top.length === 0 && <p className="text-sm text-mut">Loading markets… (start the API + seed the database)</p>}
              {top.map((p) => {
                const price = prices[p.symbol] ?? Number(p.lastPrice);
                const change = Number(p.change24hPct);
                return (
                  <Link key={p.symbol} href={`/trade?symbol=${p.symbol}`} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 hover:bg-hover">
                    <span className="font-semibold">{p.symbol}</span>
                    <span className="flex items-center gap-4">
                      <span className="tabular-nums">{fmt(price, pdec(price))}</span>
                      <span className={change >= 0 ? 'text-up' : 'text-down'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-mut">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-mut">
        © {new Date().getFullYear()} Tradevix. Demo platform for educational use.
      </footer>
    </div>
  );
}
