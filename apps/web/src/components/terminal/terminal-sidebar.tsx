'use client';

import Link from 'next/link';

const I = ({ d, className = 'h-[22px] w-[22px]' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items = [
  { key: 'trade', label: 'TRADE', icon: 'M3 3v18h18M7 14l4-4 3 3 5-6' },
  { key: 'support', label: 'SUPPORT', icon: 'M4 13v-1a8 8 0 0 1 16 0v1M3 13h4v7H3zM17 13h4v7h-4z' },
  { key: 'account', label: 'ACCOUNT', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0' },
  { key: 'tournaments', label: 'EVENTS', icon: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3', badge: '4' },
  { key: 'more', label: 'MORE', icon: 'M4 6h16M4 12h16M4 18h16' },
];

export function TerminalSidebar({ active = 'trade' }: { active?: string }) {
  return (
    <div className="qt-scroll flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-qt-line bg-qt-panel px-2 py-2 md:w-[74px] md:flex-col md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r md:py-3 lg:w-[92px]">
      <Link href="/trade" className="mb-1 hidden w-full flex-col items-center gap-1 border-b border-qt-line pb-3 md:flex">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-qt-accent to-[#00E676] shadow-[0_8px_22px_-6px_rgba(33,150,243,0.8)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-6 4 4 8-9" />
            <path d="M15 6h5v5" />
          </svg>
        </span>
        <span className="hidden text-[11px] font-extrabold tracking-[0.14em] text-white lg:block">TRADEVIX</span>
        <span className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-qt-mut">
          <span className="qt-live-dot h-1.5 w-1.5 rounded-full bg-qt-up" />
          Live market
        </span>
      </Link>

      <div className="flex flex-row items-center gap-1 md:w-full md:flex-col">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              title={it.label}
              className={`relative flex w-16 flex-col items-center gap-1.5 rounded-xl py-3 text-[10px] font-bold tracking-wide transition md:w-full ${
                on
                  ? 'bg-gradient-to-br from-qt-accent to-[#00E676] text-white shadow-[0_10px_26px_-8px_rgba(33,150,243,0.9)]'
                  : 'text-qt-mut hover:bg-qt-hover hover:text-qt-text'
              }`}
            >
              <I d={it.icon} />
              <span className="hidden lg:block">{it.label}</span>
              {it.badge && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-qt-accent text-[9px] font-bold text-white">
                  {it.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden flex-1 md:block" />

      <div className="hidden w-full flex-col items-center gap-2 md:flex">
        <div className="flex items-center gap-1 rounded-xl bg-qt-bg p-1">
          {['M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', 'M11 5L6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 5 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'].map((d) => (
            <button key={d} className="grid h-8 w-8 place-items-center rounded-lg text-qt-mut hover:bg-qt-hover hover:text-qt-text" title="Control">
              <I d={d} className="h-4 w-4" />
            </button>
          ))}
        </div>

        <button className="qt-accent-btn flex w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-extrabold text-white">
          <I d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" className="h-4 w-4" />
          JOIN US
        </button>
        <button className="w-full rounded-xl bg-gradient-to-b from-[#22e884] to-[#00E676] px-2 py-2.5 text-[11px] font-extrabold text-[#04140b] shadow-[0_8px_22px_-8px_rgba(0,230,118,0.9)]">
          Help
        </button>

        <div className="w-full px-1 pt-1">
          <div className="mb-1 flex items-center justify-between text-[8px] font-bold tracking-wide text-qt-mut">
            <span className="hidden lg:block">WIN RATE</span>
            <span className="text-qt-up">96%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-qt-bg">
            <div className="h-full rounded-full bg-gradient-to-r from-qt-accent to-qt-up" style={{ width: '96%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
