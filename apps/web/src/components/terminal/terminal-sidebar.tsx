'use client';

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
    <div className="flex h-full shrink-0">
      <nav className="qt-scroll flex w-[88px] flex-col items-center gap-1 overflow-y-auto border-r border-qt-line bg-qt-panel px-2 py-2">
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key}
              title={it.label}
              className={`relative flex w-full flex-col items-center gap-1.5 rounded-xl py-3 text-[10px] font-bold tracking-wide transition ${
                on
                  ? 'bg-gradient-to-br from-qt-accent to-[#0aa34d] text-white shadow-[0_10px_26px_-8px_rgba(0,102,255,0.9)]'
                  : 'text-qt-mut hover:bg-qt-hover hover:text-qt-text'
              }`}
            >
              <I d={it.icon} />
              <span>{it.label}</span>
              {it.badge && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-qt-accent text-[9px] font-bold text-white">
                  {it.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="flex-1" />

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
        <button className="w-full rounded-xl bg-gradient-to-b from-[#06c65c] to-[#00b050] px-2 py-2.5 text-[11px] font-extrabold text-[#04120a] shadow-[0_8px_22px_-8px_rgba(0,176,80,0.9)]">
          Help
        </button>
      </nav>

      <div className="flex w-[34px] flex-col items-center justify-center gap-2 border-r border-qt-line bg-qt-panel py-4">
        <span className="text-[8px] font-bold leading-none text-[#0aa34d]" style={{ writingMode: 'vertical-rl' }}>
          96%
        </span>
        <div className="relative h-[58vh] min-h-[220px] w-2 overflow-hidden rounded-full qt-gauge shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <span className="absolute left-1/2 top-[82%] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-qt-panel shadow" />
        </div>
        <span className="text-[8px] font-bold leading-none text-qt-down" style={{ writingMode: 'vertical-rl' }}>
          4%
        </span>
      </div>
    </div>
  );
}
