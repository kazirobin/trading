'use client';

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { getSocket } from '@/lib/socket';

const INTERVALS = ['1m', '5m', '15m', '1h', '1d'] as const;
type Interval = (typeof INTERVALS)[number];

const STEP: Record<Interval, number> = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 };

export function Chart({ symbol }: { symbol: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastRef = useRef<CandlestickData | null>(null);
  const [interval, setInterval] = useState<Interval>('1m');
  const [status, setStatus] = useState('connecting…');

  useEffect(() => {
    let disposed = false;

    (async () => {
      const { createChart } = await import('lightweight-charts');
      if (disposed || !wrapRef.current) return;

      const chart = createChart(wrapRef.current, {
        layout: { background: { color: '#111827' }, textColor: '#94A3B8' },
        grid: { vertLines: { color: '#1a2335' }, horzLines: { color: '#1a2335' } },
        rightPriceScale: { borderColor: '#263043' },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#263043', rightOffset: 6 },
        crosshair: {
          vertLine: { color: '#8B5CF6', labelBackgroundColor: '#7C3AED' },
          horzLine: { color: '#8B5CF6', labelBackgroundColor: '#7C3AED' },
        },
        autoSize: true,
      });
      const series = chart.addCandlestickSeries({
        upColor: '#22C55E',
        downColor: '#EF4444',
        borderVisible: false,
        wickUpColor: '#22C55E',
        wickDownColor: '#EF4444',
      });

      chartRef.current = chart;
      seriesRef.current = series;

      return () => {
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setStatus('loading…');
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=500`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows: unknown[][] = await res.json();
        const data: CandlestickData[] = rows.map((r) => ({
          time: Math.floor(Number(r[0]) / 1000) as UTCTimestamp,
          open: Number(r[1]),
          high: Number(r[2]),
          low: Number(r[3]),
          close: Number(r[4]),
        }));
        if (cancelled) return;
        seriesRef.current?.setData(data);
        lastRef.current = data[data.length - 1] ?? null;
        chartRef.current?.timeScale().fitContent();
        setStatus('live');
      } catch (e) {
        if (!cancelled) setStatus('chart data unavailable');
      }
    }
    if (seriesRef.current) void load();
    else {
      const t = setTimeout(load, 400);
      return () => clearTimeout(t);
    }
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  useEffect(() => {
    const socket = getSocket();
    const step = STEP[interval];
    const onTrade = (t: { symbol: string; price: string }) => {
      if (t.symbol !== symbol) return;
      const price = Number(t.price);
      const last = lastRef.current;
      const bucket = Math.floor(Date.now() / 1000 / step) * step;
      if (!last || bucket > (last.time as number)) {
        const next: CandlestickData = { time: bucket as UTCTimestamp, open: price, high: price, low: price, close: price };
        lastRef.current = next;
        seriesRef.current?.update(next);
      } else {
        const next: CandlestickData = {
          ...last,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
        };
        lastRef.current = next;
        seriesRef.current?.update(next);
      }
    };
    socket.on('trade', onTrade);
    return () => {
      socket.off('trade', onTrade);
    };
  }, [symbol, interval]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`rounded-md px-3 py-1 text-xs font-bold ${iv === interval ? 'bg-brand text-white' : 'text-mut hover:bg-hover'}`}
            >
              {iv}
            </button>
          ))}
        </div>
        <span className={`text-xs ${status === 'live' ? 'text-up' : 'text-warn'}`}>● {status}</span>
      </div>
      <div ref={wrapRef} className="min-h-[320px] flex-1" />
    </div>
  );
}
