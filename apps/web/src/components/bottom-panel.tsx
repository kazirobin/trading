'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { dateTime, fmt, pdec } from '@/lib/format';
import { useAuth } from '@/lib/store';
import type { Order, TradeDto } from '@/lib/types';

type Tab = 'open' | 'history' | 'trades';

export function BottomPanel({ refreshKey }: { refreshKey?: number }) {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('open');
  const [open, setOpen] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [trades, setTrades] = useState<TradeDto[]>([]);

  const load = useCallback(() => {
    if (!token) return;
    api.get<Order[]>('/api/orders?status=open').then(setOpen).catch(() => undefined);
    api.get<Order[]>('/api/orders').then((rows) => setHistory(rows.filter((o) => !['open', 'partial'].includes(o.status)))).catch(() => undefined);
    api.get<TradeDto[]>('/api/trades?limit=50').then(setTrades).catch(() => undefined);
  }, [token]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const socket = getSocket();
    const onOrder = () => load();
    socket.on('order', onOrder);
    return () => {
      socket.off('order', onOrder);
    };
  }, [load]);

  async function cancel(id: string) {
    try {
      await api.del(`/api/orders/${id}`);
      load();
    } catch {
      /* ignore */
    }
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'open', label: 'Open Orders', count: open.length },
    { key: 'history', label: 'Order History' },
    { key: 'trades', label: 'My Trades' },
  ];

  return (
    <div className="card flex h-full flex-col">
      <div className="flex border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-semibold ${tab === t.key ? 'text-white shadow-[inset_0_-2px_0_#8B5CF6]' : 'text-mut'}`}
          >
            {t.label}
            {t.count ? <span className="ml-1 rounded-full bg-hover px-2 text-xs">{t.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {!token && <p className="p-6 text-center text-sm text-mut">Log in to view your orders.</p>}
        {token && tab === 'open' && (
          <Table
            head={['Time', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Filled', 'Status', '']}
            empty="No open orders"
            rows={open.map((o) => [
              dateTime(o.createdAt),
              o.symbol,
              o.type,
              <span key="s" className={o.side === 'buy' ? 'text-up' : 'text-down'}>{o.side.toUpperCase()}</span>,
              o.price ? fmt(Number(o.price), pdec(Number(o.price))) : 'Market',
              Number(o.amount).toString(),
              Number(o.filled).toString(),
              o.status,
              <button key="c" onClick={() => cancel(o._id)} className="text-down underline">
                Cancel
              </button>,
            ])}
          />
        )}
        {token && tab === 'history' && (
          <Table
            head={['Time', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Filled', 'Status']}
            empty="No order history"
            rows={history.map((o) => [
              dateTime(o.createdAt),
              o.symbol,
              o.type,
              <span key="s" className={o.side === 'buy' ? 'text-up' : 'text-down'}>{o.side.toUpperCase()}</span>,
              o.price ? fmt(Number(o.price), pdec(Number(o.price))) : 'Market',
              Number(o.amount).toString(),
              Number(o.filled).toString(),
              o.status,
            ])}
          />
        )}
        {token && tab === 'trades' && (
          <Table
            head={['Time', 'Pair', 'Price', 'Amount', 'Value']}
            empty="No trades yet"
            rows={trades.map((t) => [
              dateTime(t.createdAt),
              t.symbol,
              fmt(Number(t.price), pdec(Number(t.price))),
              Number(t.amount).toString(),
              fmt(Number(t.quoteAmount), 2),
            ])}
          />
        )}
      </div>
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mut">
          {head.map((h, i) => (
            <th key={i} className="px-3 py-2">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={head.length} className="px-3 py-8 text-center text-mut">
              {empty}
            </td>
          </tr>
        )}
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line/60 hover:bg-hover">
            {r.map((c, j) => (
              <td key={j} className="whitespace-nowrap px-3 py-2 tabular-nums">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
