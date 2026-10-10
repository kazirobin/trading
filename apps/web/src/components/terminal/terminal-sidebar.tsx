'use client';

import Link from 'next/link';
import { TerminalToolbar } from './terminal-toolbar';

const I = ({ d, className = 'h-5 w-5' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

type NavItem = { label: string; active: boolean; badge?: number; d: string };

const nav: NavItem[] = [
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
    label: 'AGENT ACCOUNT',
    active: false,
    d: 'M5 10h14l1 10H4L5 10zM9 10V8a3 3 0 0 1 6 0v2M12 14v3M9.5 14h.01M14.5 14h.01',
  },
  { label: 'MORE', active: false, d: 'M5 12h.01M12 12h.01M19 12h.01' },
];

export function TerminalSidebar({ open = true, onToggle }: { open?: boolean; onToggle?: () => void }) {
  return (
    <aside
      className={`group/side hidden shrink-0 flex-col items-center overflow-hidden border-r border-qt-line bg-gradient-to-b from-qt-sidebar via-qt-sidebar to-[#0e1119] transition-[width] duration-300 ease-in-out lg:flex ${
        open ? 'w-[74px]' : 'w-0 border-r-0'
      }`}
    >
      <button
        onClick={onToggle}
        title={open ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={open ? 'Hide sidebar' : 'Show sidebar'}
        className="grid h-14 w-full shrink-0 place-items-center text-qt-mut transition-colors hover:bg-qt-hover/60 hover:text-qt-text"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-transparent transition-all duration-200 group-hover/side:border-qt-line group-hover/side:bg-qt-panel">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </span>
      </button>

      <div className="h-px w-10 bg-gradient-to-r from-transparent via-qt-line to-transparent" />

      <div className="mt-3 flex w-full flex-col items-center gap-1 pb-2">
        {nav.map(({ label, active, badge, d }) => (
          <Link
            key={label}
            href={label === 'TRADE' ? '/trade' : '/'}
            title={label}
            aria-label={label}
            className={`group relative flex w-[66px] flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all duration-200 ${
              active
                ? 'bg-gradient-to-b from-qt-panel2 to-[#2a3042]/60 text-qt-text shadow-[0_8px_20px_-8px_rgba(43,153,255,0.55)] ring-1 ring-inset ring-qt-line/70'
                : 'text-qt-mut hover:bg-qt-panel2/60 hover:text-qt-text hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
            }`}
          >
            {active && (
              <>
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-qt-accent to-[#6dB8ff]" />
                <span className="absolute -right-px -top-px h-2.5 w-2.5 rounded-bl-md border-l border-b border-qt-line/70 bg-gradient-to-br from-qt-accent/25 to-transparent" />
              </>
            )}
            <I
              d={d}
              className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-qt-accent drop-shadow-[0_2px_6px_rgba(43,153,255,0.4)]' : 'group-hover:text-qt-text'}`}
            />
            <span className={`text-center text-[8px] font-extrabold uppercase leading-[1.25] tracking-[0.02em] ${active ? 'text-qt-text' : 'text-qt-mut group-hover:text-qt-text'}`}>
              {label}
            </span>
            {typeof badge === 'number' && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-qt-accent px-1 text-[10px] font-bold text-white shadow-[0_2px_8px_-2px_rgba(43,153,255,0.9)] ring-2 ring-qt-sidebar">
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