'use client';

import { useEffect, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi, CandlestickData, IPriceLine, UTCTimestamp } from 'lightweight-charts';
import { ASSETS, INTERVALS, STEP, assetOf, fetchKlines, type Interval } from '@/lib/binance';

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

  const [interval, setIntervalState] = useState<Interval>('1m');
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [now, setNow] = useState(() => new Date());
  const [pairOpen, setPairOpen] = useState(false);

  const asset = assetOf(symbol);

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
        layout: { background: { type: ColorType.Solid, color: 'rgba(0,0,0,0)' }, textColor: '#8a95a9', fontSize: 11 },
        grid: { vertLines: { color: '#1b2438' }, horzLines: { color: '#1b2438' } },
        rightPriceScale: { borderColor: '#26314a', scaleMargins: { top: 0.12, bottom: 0.12 } },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#26314a', rightOffset: 8, barSpacing: 9 },
        crosshair: {
          vertLine: { color: '#0066ff', labelBackgroundColor: '#0066ff' },
          horzLine: { color: '#0066ff', labelBackgroundColor: '#0066ff' },
        },
        autoSize: true,
      });
      const series = chart.addCandlestickSeries({
        upColor: '#00b050',
        downColor: '#d63e3e',
        borderVisible: false,
        wickUpColor: '#00b050',
        wickDownColor: '#d63e3e',
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
          color: '#0066ff',
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-qt-line bg-qt-panel">
      {/* watermark + chart */}
      <div className="pointer-events-none absolute inset-0 z-0 grid place-items-center">
        <span className="qt-watermark text-[16vw] leading-none">DEMO</span>
      </div>
      <div ref={wrapRef} className="absolute inset-x-0 bottom-0 top-0 z-10" />

      {/* top-left overlay */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2">
        <div className="pointer-events-auto relative">
          <button
            onClick={() => setPairOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl border border-qt-line bg-qt-bg/90 px-3 py-2 backdrop-blur hover:border-qt-accent"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-qt-accent to-[#00b050] text-[13px] font-extrabold text-white">
              {asset.coin}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-bold text-white">{asset.label}</span>
              <span className="block text-[11px] font-bold text-qt-gold">{asset.payout}%</span>
            </span>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-qt-mut" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {pairOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] w-72 rounded-xl border border-qt-line bg-qt-panel p-2 shadow-2xl">
              <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-qt-mut">Select asset</p>
              <div className="qt-scroll max-h-72 overflow-y-auto">
                {ASSETS.map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => {
                      onSymbolChange(a.symbol);
                      setPairOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-qt-hover ${
                      a.symbol === symbol ? 'bg-qt-hover' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-qt-panel2 text-[10px] font-bold text-white">{a.coin}</span>
                      <span className="font-semibold text-qt-text">{a.label}</span>
                    </span>
                    <span className="font-bold text-qt-gold">{a.payout}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="w-fit rounded-lg border border-qt-line bg-qt-bg/80 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-qt-mut backdrop-blur">
          {clockUTC(now)} <span className="text-qt-accent">UTC</span>
        </span>

        <button className="pointer-events-auto w-fit rounded-lg bg-qt-accent/15 px-2.5 py-1.5 text-[11px] font-bold text-[#5aa0ff] ring-1 ring-inset ring-qt-accent/40 hover:bg-qt-accent/25">
          PAIR INFORMATION
        </button>
      </div>

      {/* live price */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 text-center">
        <p className="text-2xl font-extrabold tabular-nums text-white drop-shadow">{price != null ? fmtPrice(price) : '—'}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-qt-mut">{asset.label}</p>
      </div>

      {/* interval chips */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-lg border border-qt-line bg-qt-bg/85 p-1 backdrop-blur">
        {INTERVALS.map((iv) => (
          <button
            key={iv}
            onClick={() => setIntervalState(iv)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${iv === interval ? 'bg-qt-accent text-white' : 'text-qt-mut hover:text-qt-text'}`}
          >
            {iv.toUpperCase()}
          </button>
        ))}
      </div>

      {/* beginning-of-trade dashed vertical */}
      <div className="pointer-events-none absolute bottom-0 top-0 z-[15]" style={{ left: '34%' }}>
        <div className="h-full border-l border-dashed border-qt-accent/60" />
        <span className="absolute -top-0.5 left-2 whitespace-nowrap rounded bg-qt-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
          Beginning of trade
        </span>
      </div>

      {/* left tools */}
      <div className="absolute left-2 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1 rounded-xl border border-qt-line bg-qt-bg/85 p-1 backdrop-blur">
        {['M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', 'M3 3v18h18M7 14l3-3 2 2 4-5'].map((d) => (
          <button key={d} className="grid h-8 w-8 place-items-center rounded-lg text-qt-mut hover:bg-qt-hover hover:text-qt-text" title="Drawing tools">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d={d} />
            </svg>
          </button>
        ))}
      </div>

      {/* zoom */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center overflow-hidden rounded-lg border border-qt-line bg-qt-bg/85 backdrop-blur">
        <button onClick={() => zoom('out')} className="px-3 py-1.5 text-lg font-bold leading-none text-qt-mut hover:bg-qt-hover hover:text-qt-text">
          −
        </button>
        <span className="px-2 text-[10px] font-bold uppercase text-qt-mut">zoom</span>
        <button onClick={() => zoom('in')} className="px-3 py-1.5 text-lg font-bold leading-none text-qt-mut hover:bg-qt-hover hover:text-qt-text">
          +
        </button>
      </div>

      <span className={`absolute bottom-4 right-4 z-20 text-[11px] font-semibold ${status === 'live' ? 'text-qt-up' : status === 'offline' ? 'text-qt-down' : 'text-qt-mut'}`}>
        ● {status}
      </span>
    </div>
  );
}
