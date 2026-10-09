'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { fmt, pdec } from '@/lib/format';
import { useAuth } from '@/lib/store';
import type { MarketPair, Order, OrderType } from '@/lib/types';

export function OrderForm({ pair, onPlaced }: { pair: MarketPair; onPlaced?: () => void }) {
  const { token } = useAuth();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<OrderType>('limit');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPrice(String(Number(pair.lastPrice).toFixed(pair.pricePrecision)));
    setStopPrice('');
    setAmount('');
  }, [pair.symbol, pair.lastPrice, pair.pricePrecision]);

  const effPrice = type === 'market' ? Number(pair.lastPrice) : Number(price) || Number(pair.lastPrice);
  const total = useMemo(() => (Number(amount) || 0) * effPrice, [amount, effPrice]);
  const needsPrice = type === 'limit' || type === 'stop_limit';
  const needsStop = type === 'stop_limit' || type === 'stop_market';

  async function submit() {
    setMessage(null);
    if (!token) {
      setMessage({ ok: false, text: 'Please log in first.' });
      return;
    }
    setBusy(true);
    try {
      const order = await api.post<Order>('/api/orders', {
        symbol: pair.symbol,
        side,
        type,
        amount: Number(amount),
        price: needsPrice ? Number(price) : undefined,
        stopPrice: needsStop ? Number(stopPrice) : undefined,
      });
      setMessage({ ok: true, text: `Order ${order.status} · ${order.side} ${Number(order.amount)} ${pair.baseAsset}` });
      setAmount('');
      onPlaced?.();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Order failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-3">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-bg p-1">
        <button
          onClick={() => setSide('buy')}
          className={`rounded-md py-2 text-sm font-bold ${side === 'buy' ? 'bg-up text-[#04130a]' : 'text-mut'}`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`rounded-md py-2 text-sm font-bold ${side === 'sell' ? 'bg-down text-white' : 'text-mut'}`}
        >
          Sell
        </button>
      </div>

      <div className="mt-3">
        <label className="label">Order type</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value as OrderType)}>
          <option value="limit">Limit</option>
          <option value="market">Market</option>
          <option value="stop_limit">Stop-limit</option>
          <option value="stop_market">Stop-market</option>
        </select>
      </div>

      {needsStop && (
        <div className="mt-3">
          <label className="label">Stop price</label>
          <input className="input tabular-nums" inputMode="decimal" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} />
        </div>
      )}

      {needsPrice && (
        <div className="mt-3">
          <label className="label">Price ({pair.quoteAsset})</label>
          <input className="input tabular-nums" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      )}

      <div className="mt-3">
        <label className="label">Amount ({pair.baseAsset})</label>
        <input className="input tabular-nums" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <span className="text-mut">Total</span>
        <span className="tabular-nums">
          {fmt(total, 2)} {pair.quoteAsset}
        </span>
      </div>
      <div className="mt-1 flex justify-between text-xs text-mut">
        <span>Fee (taker)</span>
        <span>{Number(pair.takerFeePct).toFixed(2)}%</span>
      </div>

      {message && <p className={`mt-3 text-sm ${message.ok ? 'text-up' : 'text-down'}`}>{message.text}</p>}

      <button
        onClick={submit}
        disabled={busy || !amount}
        className={`mt-3 w-full py-3 ${side === 'buy' ? 'btn-up' : 'btn-down'}`}
      >
        {busy ? 'Placing…' : `${side === 'buy' ? 'Buy' : 'Sell'} ${pair.baseAsset}`}
      </button>
      <p className="mt-2 text-center text-[11px] text-mut">
        Est. price {fmt(effPrice, pdec(effPrice))} {pair.quoteAsset}
      </p>
    </div>
  );
}
