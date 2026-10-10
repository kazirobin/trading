'use client';

import Link from 'next/link';
import { TerminalToolbar } from './terminal-toolbar';

const I = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const nav = [
  {
    label: 'TRADE',
    active: true,
    d: 'M4 4h16v16H4zM7 15l3-4 3 2 4-6',
  },
  {
    label: 'SUPPORT',
    active: false,
    d: 'M4 4h16v14H9l-5 4zM9.5 9a2.5 2.5 0 0 1 5 0c0 .9-.7 1.3-1.5 1.8v.7M13 14.5h.01',
  },
  {
    label: 'ACCOUNT',
    active: false,
    d: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c1.5-3.7 4.4-5.5 8-5.5s6.5 1.8 8 5.5',
  },
  {
    label: 'TOURNAMENTS',
    active: false,
    badge: 4,
    d: 'M8 21h8M12 17v4M6 3h12v3a6 6 0 0 1-12 0V3zM6 5H3a4 4 0 0 0 3.2 3.9M18 5h3a4 4 0 0 1-3.2 3.9',
  },
  { label: 'MORE', active: false, d: 'M5 12h.01M12 12h.01M19 12h.01' },
];

export function TerminalSidebar({ open = true, onToggle }: { open?: boolean; onToggle?: () => void }) {
  return (
    <aside
      className={`hidden shrink-0 flex-col items-center overflow-hidden border-r border-qt-line bg-qt-sidebar transition-[width] duration-300 ease-in-out lg:flex ${
        open ? 'w-[74px]' : 'w-0 border-r-0'
      }`}
    >
      <button
        onClick={onToggle}
        className="grid h-14 w-full shrink-0 place-items-center text-qt-mut hover:bg-qt-hover hover:text-qt-text"
        aria-label={open ? 'Hide sidebar' : 'Show sidebar'}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="w-full border-b border-qt-line" />

      <div className="mt-4 flex w-full flex-col items-center gap-1">
        {nav.map(({ label, active, badge, d }) => (
          <Link
            key={label}
            href={label === 'TRADE' ? '/trade' : '/'}
            aria-label={label}
            className={`relative flex w-[62px] flex-col items-center gap-1 rounded-lg py-1.5 ${
              active ? 'bg-qt-panel2 text-qt-text' : 'text-qt-mut hover:bg-qt-hover hover:text-qt-text'
            }`}
          >
            <I d={d} className="h-5 w-5" />
            <span className="text-[8px] font-extrabold uppercase tracking-[0.04em]">{label}</span>
            {typeof badge === 'number' && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-qt-accent px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <TerminalToolbar />
    </aside>
  );
}