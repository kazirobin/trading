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
    label: 'ANALYTICS',
    active: false,
    d: 'M4 20V4M4 20h16M8 20v-6M12 20v-9M16 20v-4M20 20v-11',
  },
  {
    label: 'PORTFOLIO',
    active: false,
    d: 'M3 3h3M18 3h3M3 21h3M18 21h3M3 6h3M18 6h3M3 15h3M18 15h3M12 4v4l2.5 1.5M12 20v-4l-2.5-1.5',
  },
  {
    label: 'AGENT ACCOUNT',
    active: false,
    d: 'M5 10h14l1 10H4L5 10zM9 10V8a3 3 0 0 1 6 0v2M12 14v3M9.5 14h.01M14.5 14h.01',
  },
  { label: 'SETTINGS', active: false, d: 'M9.4 4.5l.6-1.5h4l.6 1.5a2 2 0 0 0 1.4 1.1l1.6.3 1.2-1 2.8 2.8-1 1.2.3 1.6a2 2 0 0 0 1.1 1.4l1.5.6v4l-1.5.6a2 2 0 0 0-1.1 1.4l-.3 1.6 1 1.2-2.8 2.8-1.2-1-1.6.3a2 2 0 0 0-1.4 1.1l-.6 1.5h-4l-.6-1.5a2 2 0 0 0-1.4-1.1l-1.6-.3-1.2 1-2.8-2.8 1-1.2-.3-1.6a2 2 0 0 0-1.1-1.4L1.5 13v-4l1.5-.6A2 2 0 0 0 4.1 7l.3-1.6-1-1.2L7.2 1.4l1.2 1 1.6-.3A2 2 0 0 0 9.4 4.5zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
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
        className="ml-auto mr-2 mt-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-neo-mut transition-colors hover:bg-white/5 hover:text-neo-text"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl border border-transparent transition-all duration-200 hover:border-neo-line/60">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </span>
      </button>

      <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-neo-line to-transparent" />

      <div className="neo-scroll mt-3 flex w-full min-w-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2">
        {nav.map(({ label, active, badge, d }) => (
          <Link
            key={label}
            href={label === 'TRADE' ? '/trade' : '/'}
            title={label}
            aria-label={label}
            className="group relative flex min-w-0 w-full flex-row items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all duration-200 hover:bg-white/[0.06]"
          >
            {active && (
              <>
                <span className="absolute inset-0 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-transparent shadow-[0_0_20px_-4px_rgba(43,153,255,0.35)]" />
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-400 to-violet-500 shadow-[0_0_10px_rgba(43,153,255,0.8)]" />
              </>
            )}
            <I
              d={d}
              className={`relative z-10 h-5 w-5 shrink-0 transition-all duration-200 group-hover:-translate-y-0.5 ${
                active ? 'text-sky-300 drop-shadow-[0_0_8px_rgba(43,153,255,0.8)]' : 'text-neo-mut group-hover:text-white'
              }`}
            />
            <span className={`relative z-10 min-w-0 truncate text-[11px] font-extrabold uppercase leading-none tracking-[0.03em] ${active ? 'text-white' : 'text-neo-mut group-hover:text-neo-text'}`}>
              {label}
            </span>
            {typeof badge === 'number' && (
              <span className="relative z-20 ml-auto grid h-4 min-w-[16px] shrink-0 place-items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-1 text-[10px] font-bold text-black shadow-[0_0_12px_-2px_rgba(251,191,36,0.9)]">
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