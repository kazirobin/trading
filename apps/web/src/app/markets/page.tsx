'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { useMarket } from '@/lib/store';
import { fmt, pdec } from '@/lib/format';

export default function MarketsPage() {
  const { pairs, prices } = useMarket();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold">Markets</h1>
        <p className="mt-1 text-sm text-mut">Live prices streamed from the exchange.</p>

        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mut">
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">24h change</th>
                <th className="px-4 py-3">24h high</th>
                <th className="px-4 py-3">24h low</th>
                <th className="px-4 py-3">Fees</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pairs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-mut">
                    No markets. Ensure the API is running and the database is seeded.
                  </td>
                </tr>
              )}
              {pairs.map((p) => {
                const price = prices[p.symbol] ?? Number(p.lastPrice);
                const change = Number(p.change24hPct);
                return (
                  <tr key={p.symbol} className="border-b border-line hover:bg-hover">
                    <td className="px-4 py-3 font-semibold">{p.symbol}</td>
                    <td className="px-4 py-3 tabular-nums">{fmt(price, pdec(price))}</td>
                    <td className={`px-4 py-3 ${change >= 0 ? 'text-up' : 'text-down'}`}>
                      {change >= 0 ? '+' : ''}
                      {change.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums text-mut">{fmt(Number(p.high24h), pdec(Number(p.high24h)))}</td>
                    <td className="px-4 py-3 tabular-nums text-mut">{fmt(Number(p.low24h), pdec(Number(p.low24h)))}</td>
                    <td className="px-4 py-3 text-warn">
                      {Number(p.makerFeePct).toFixed(2)}% / {Number(p.takerFeePct).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/trade?symbol=${p.symbol}`} className="btn-primary px-3 py-1 text-xs">
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
