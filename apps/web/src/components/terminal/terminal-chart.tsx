'use client';

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, CandlestickData, IPriceLine, UTCTimestamp } from 'lightweight-charts';
import { ASSETS, STEP, assetOf, fetchKlines, type Interval } from '@/lib/binance';

const WSH = ['wss://stream.binance.com:9443', 'wss://data-stream.binance.vision:9443'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmtPrice(n: number) {
  const d = n < 1 ? 5 : n < 100 ? 3 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function clockUTC(d = new Date()) {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}
function Flags({ base, quote, size = 'h-5 w-5' }: { base: string; quote: string; size?: string }) {
  return (
    <span className={`flex ${size === 'h-5 w-5' ? '-space-x-1.5' : '-space-x-2'}`}>
      <span className={`grid ${size} place-items-center rounded-full bg-gradient-to-br from-[#4f9dff] to-[#2b6ef0] text-[9px] font-bold text-white ring-2 ring-qt-bg`}>
        {base[0]}
      </span>
      <span className={`grid ${size} place-items-center rounded-full bg-gradient-to-br from-[#ffb347] to-[#e88400] text-[9px] font-bold text-white ring-2 ring-qt-bg`}>
        {quote[0]}
      </span>
    </span>
  );
}

export function TerminalChart({
  symbol,
  onSymbolChange,
}: {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lastRef = useRef<CandlestickData | null>(null);
  const lineRef = useRef<IPriceLine | null>(null);

  const [interval] = useState<Interval>('1m');
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [now, setNow] = useState(() => new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [tabs, setTabs] = useState<string[]>(['BTCUSDT', 'ETHUSDT']);

  useEffect(() => {
    setTabs((prev) => (prev.includes(symbol) ? prev : [symbol, ...prev].slice(0, 3)));
  }, [symbol]);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const { createChart, ColorType } = await import('lightweight-charts');
      if (disposed || !wrapRef.current) return;
      const chart = createChart(wrapRef.current, {
        layout: { background: { type: ColorType.Solid, color: '#232838' }, textColor: '#8B92A6', fontSize: 11 },
        grid: { vertLines: { color: '#2A3042' }, horzLines: { color: '#2A3042' } },
        rightPriceScale: { borderColor: '#2E3547', scaleMargins: { top: 0.12, bottom: 0.1 } },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#2E3547', rightOffset: 8, barSpacing: 9 },
        crosshair: {
          vertLine: { color: '#2B99FF', labelBackgroundColor: '#2B99FF' },
          horzLine: { color: '#2B99FF', labelBackgroundColor: '#2B99FF' },
        },
        autoSize: true,
      });
      const series = chart.addCandlestickSeries({
        upColor: '#0FAF59',
        downColor: '#F6465D',
        borderVisible: false,
        wickUpColor: '#0FAF59',
        wickDownColor: '#F6465D',
        priceLineVisible: false,
        lastValueVisible: false,
      });
      chartRef.current = chart;
      seriesRef.current = series;
      return () => chart.remove();
    })();
    return () => {
      disposed = true;
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lineRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetchKlines(symbol, interval, 500)
      .then((data) => {
        if (cancelled || !seriesRef.current) return;
        seriesRef.current.setData(data as CandlestickData[]);
        lastRef.current = (data[data.length - 1] as CandlestickData) ?? null;
        if (lastRef.current) setPrice(lastRef.current.close);
        chartRef.current?.timeScale().fitContent();
        setStatus('live');
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  useEffect(() => {
    let closed = false;
    let ws: WebSocket | null = null;
    let host = 0;
    let guard: ReturnType<typeof setTimeout> | null = null;
    const step = STEP[interval];
    const streams = [`${symbol.toLowerCase()}@aggTrade`, `${symbol.toLowerCase()}@kline_${interval}`].join('/');

    const applyPrice = (p: number, tsSec: number) => {
      setPrice(p);
      const last = lastRef.current;
      if (!last) return;
      const bucket = Math.floor(tsSec / step) * step;
      const next: CandlestickData =
        bucket > (last.time as number)
          ? { time: bucket as UTCTimestamp, open: p, high: p, low: p, close: p }
          : { ...last, high: Math.max(last.high, p), low: Math.min(last.low, p), close: p };
      lastRef.current = next;
      seriesRef.current?.update(next);
      if (lineRef.current) lineRef.current.applyOptions({ price: p });
      else if (seriesRef.current)
        lineRef.current = seriesRef.current.createPriceLine({
          price: p,
          color: '#2B99FF',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: '',
        });
    };

    const connect = () => {
      if (closed) return;
      let sock: WebSocket;
      try {
        sock = new WebSocket(`${WSH[host]}/stream?streams=${streams}`);
      } catch {
        setTimeout(connect, 2000);
        return;
      }
      ws = sock;
      guard = setTimeout(() => {
        if (sock === ws && sock.readyState !== WebSocket.OPEN) {
          host = (host + 1) % WSH.length;
          try {
            sock.close();
          } catch {
            /* noop */
          }
        }
      }, 6000);
      sock.onmessage = (e) => {
        try {
          const m = JSON.parse(String(e.data)) as { stream: string; data: Record<string, unknown> };
          if (m.stream.endsWith('aggTrade')) {
            applyPrice(Number(m.data.p), Number(m.data.T) / 1000);
          } else if (m.stream.includes('@kline_')) {
            const k = m.data.k as Record<string, unknown>;
            const c: CandlestickData = {
              time: Math.floor(Number(k.t) / 1000) as UTCTimestamp,
              open: Number(k.o),
              high: Number(k.h),
              low: Number(k.l),
              close: Number(k.c),
            };
            lastRef.current = c;
            seriesRef.current?.update(c);
            setPrice(c.close);
          }
        } catch {
          /* noop */
        }
      };
      sock.onerror = () => {
        if (sock === ws) setStatus('offline');
      };
      sock.onclose = () => {
        if (guard) clearTimeout(guard);
        if (closed) return;
        setStatus('offline');
        setTimeout(connect, 2500);
      };
    };
    connect();
    return () => {
      closed = true;
      if (guard) clearTimeout(guard);
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    };
  }, [symbol, interval]);

  const zoom = (dir: 'in' | 'out') => {
    const ts = chartRef.current?.timeScale();
    if (!ts) return;
    const cur = (ts.options() as { barSpacing?: number }).barSpacing ?? 9;
    const next = Math.max(3, Math.min(40, cur + (dir === 'in' ? 2 : -2)));
    ts.applyOptions({ barSpacing: next });
  };

  const closeTab = (sym: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((s) => s !== sym);
      if (sym === symbol) onSymbolChange(next[0]!);
      return next;
    });
  };

  const addTab = (sym: string) => {
    setTabs((prev) => (prev.includes(sym) ? prev : [...prev, sym]));
    onSymbolChange(sym);
    setAddOpen(false);
  };

  const a = assetOf(symbol);
  const base = a.label.split('/')[0] ?? 'B';
  const quote = a.label.split('/')[1] ?? 'T';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-qt-line bg-qt-panel lg:border-r lg:border-t-0">
      <div ref={wrapRef} className="absolute inset-0 z-0" />

      {/* DEMO watermark */}
      <span className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] text-[7rem] font-black uppercase tracking-widest text-white/[0.035] select-none lg:text-[10rem]">
        Demo
      </span>

      {/* asset selector cards */}
      <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-wrap items-start gap-1">
        {tabs.map((sym) => {
          const ta = assetOf(sym);
          const on = sym === symbol;
          const [tb, tq] = ta.label.split('/');
          return (
            <div
              key={sym}
              className={`group pointer-events-auto flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] ${
                on ? 'border border-qt-line bg-qt-panel2 text-qt-text' : 'bg-qt-bg/60 text-qt-mut hover:bg-qt-panel2 hover:text-qt-text'
              }`}
            >
              <button onClick={() => onSymbolChange(sym)} className="flex items-center gap-1.5">
                <Flags base={tb ?? 'B'} quote={tq ?? 'T'} />
                <span className="font-semibold">
                  {ta.label}
                  {on && <span className="ml-1 text-[9px] font-semibold uppercase text-qt-mut">(OTC)</span>}
                </span>
                <span className="font-bold text-qt-gold">{ta.payout}%</span>
              </button>
              {on && tabs.length > 1 && (
                <button onClick={() => closeTab(sym)} className="text-qt-mut hover:text-qt-down" aria-label="Close">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </div>
          );
        })}

        <div className="relative">
          <button
            onClick={() => setAddOpen((v) => !v)}
            className="pointer-events-auto grid h-[30px] min-w-[26px] place-items-center rounded-md bg-qt-bg/60 px-1 text-qt-mut hover:bg-qt-panel2 hover:text-qt-text"
            aria-label="Add asset"
          >
            +
          </button>
          {addOpen && (
            <div className="pointer-events-auto absolute left-0 top-[calc(100%+6px)] z-30 w-64 rounded-lg border border-qt-line bg-qt-panel p-1.5 shadow-2xl">
              {ASSETS.filter((x) => !tabs.includes(x.symbol)).map((x) => (
                <button
                  key={x.symbol}
                  onClick={() => addTab(x.symbol)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-sm hover:bg-qt-hover"
                >
                  <span className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-qt-panel2 text-[9px] font-bold text-qt-text">{x.coin}</span>
                    <span className="font-semibold text-qt-text">{x.label}</span>
                  </span>
                  <span className="font-bold text-qt-gold">{x.payout}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* UTC clock + pair info */}
      <div className="pointer-events-none absolute left-2 top-[44px] z-20 flex flex-col items-start gap-1.5">
        <span className="flex items-center gap-1.5 rounded-md bg-qt-bg/60 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-qt-text backdrop-blur">
          {clockUTC(now)} <span className="text-qt-mut">UTC</span>
        </span>
        <button className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-qt-accent px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-white hover:brightness-110">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
          </svg>
          Pair information
        </button>
      </div>

      {/* active price pill */}
      <div className="pointer-events-none absolute right-3 top-2 z-20">
        <span className="inline-flex items-center rounded-full bg-qt-accent px-3 py-0.5 text-[13px] font-bold tabular-nums text-white shadow-lg">
          {price != null ? fmtPrice(price) : '—'}
        </span>
      </div>

      {/* trade interval markers */}
      <div className="pointer-events-none absolute inset-y-4 z-[5]">
        <div className="absolute inset-y-6 left-[63%] border-l border-dashed border-white/25">
          <span className="absolute left-0 top-1/4 -translate-x-1/2 whitespace-nowrap rounded bg-qt-bg/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60">
            Beginning of trade
          </span>
        </div>
        <div className="absolute inset-y-6 left-[84%] border-l border-dashed border-white/25">
          <span className="absolute left-0 top-1/4 -translate-x-1/2 whitespace-nowrap rounded bg-qt-bg/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-qt-accent">
            End of trade
          </span>
        </div>
      </div>

      {/* left floating toolbar */}
      <div className="absolute left-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-lg border border-qt-line bg-qt-bg/80 p-1 backdrop-blur">
        <button className="grid h-7 w-7 place-items-center rounded text-qt-mut hover:bg-qt-hover hover:text-qt-text" aria-label="Draw">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
        </button>
        <button className="grid h-7 w-7 place-items-center rounded bg-qt-accent text-[10px] font-bold text-white" aria-label="1 minute">
          {interval}
        </button>
        <button className="grid h-7 w-7 place-items-center rounded text-qt-text hover:bg-qt-hover" aria-label="Chart type">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><rect x="4" y="10" width="3" height="8" rx="0.5" /><rect x="10.5" y="6" width="3" height="10" rx="0.5" /><rect x="17" y="9" width="3" height="6" rx="0.5" /></svg>
        </button>
        <button className="grid h-7 w-7 place-items-center rounded text-qt-mut hover:bg-qt-hover hover:text-qt-text" aria-label="Crosshair">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 4v16M4 12h16M12 12h.01" /></svg>
        </button>
      </div>

      {/* zoom (bottom center) */}
      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center overflow-hidden rounded-lg border border-qt-line bg-qt-bg/80 backdrop-blur">
        <button onClick={() => zoom('in')} className="grid h-8 w-9 place-items-center rounded-l-lg text-qt-mut hover:bg-qt-hover hover:text-qt-text" aria-label="Zoom in">+</button>
        <span className="h-4 w-px bg-qt-line" />
        <button onClick={() => zoom('out')} className="grid h-8 w-9 place-items-center rounded-r-lg text-qt-mut hover:bg-qt-hover hover:text-qt-text" aria-label="Zoom out">−</button>
      </div>

      {/* live indicator */}
      <span className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest">
        <span className={`h-2 w-2 rounded-full ${status === 'live' ? 'bg-qt-up' : status === 'offline' ? 'bg-qt-down' : 'bg-qt-mut'}`} />
        <span className={status === 'live' ? 'text-qt-up' : status === 'offline' ? 'text-qt-down' : 'text-qt-mut'}>
          {status === 'live' ? 'Live' : status === 'offline' ? 'Offline' : 'Loading'}
        </span>
      </span>
    </div>
  );
}