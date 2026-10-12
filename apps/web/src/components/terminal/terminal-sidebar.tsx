'use client';

import Link from 'next/link';
import { TerminalToolbar } from './terminal-toolbar';

const I = ({ d, className = 'h-4 w-4' }: { d: string | string[]; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((dd, i) => (
      <path key={i} d={dd} />
    ))}
  </svg>
);

type NavItem = { label: string; active: boolean; badge?: number; d: string | string[] };

const nav: NavItem[] = [
  {
    label: 'TRADE',
    active: true,
    d: ['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'],
  },
  {
    label: 'ANALYTICS',
    active: false,
    d: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
  },
  {
    label: 'PORTFOLIO',
    active: false,
    d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  },
  {
    label: 'AGENT ACCOUNT',
    active: false,
    d: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  },
  {
    label: 'SETTINGS',
    active: false,
    d: [
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
      'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
    ],
  },
];

export function TerminalSidebar({ open = true, onToggle }: { open?: boolean; onToggle?: () => void }) {
  return (
    <aside
      className={`hidden shrink-0 flex-col overflow-hidden rounded-2xl glass-strong transition-[width,opacity] duration-300 ease-in-out lg:flex ${
        open ? 'w-[188px] opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <button
        onClick={onToggle}
        title={open ? 'Hide sidebar' : 'Show sidebar'}
        aria-label={open ? 'Hide sidebar' : 'Show sidebar'}
        className="ml-auto mr-1.5 mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neo-mut transition-colors hover:bg-neo-hover hover:text-neo-text"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="mx-1.5 h-px bg-neo-line" />

      <div className="neo-scroll mt-2 flex w-full min-w-0 flex-1 flex-col gap-2 overflow-y-auto px-1.5 pb-2">
        {nav.map(({ label, active, badge, d }) => (
          <Link
            key={label}
            href={label === 'TRADE' ? '/trade' : '/'}
            title={label}
            aria-label={label}
            className="group relative flex min-w-0 w-full flex-row items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-neo-hover"
          >
            {active && (
              <>
                <span className="absolute inset-0 rounded-lg bg-neo-hover" />
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-sky-500" />
              </>
            )}
            <I
              d={d}
              className={`relative z-10 h-4 w-4 shrink-0 ${active ? 'text-sky-500' : 'text-neo-mut group-hover:text-neo-text'}`}
            />
            <span className={`relative z-10 min-w-0 truncate text-[10px] font-bold uppercase leading-none tracking-[0.03em] ${active ? 'text-neo-text' : 'text-neo-mut group-hover:text-neo-text'}`}>
              {label}
            </span>
            {typeof badge === 'number' && (
              <span className="relative z-20 ml-auto grid h-4 min-w-[16px] shrink-0 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0b0e17]">
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