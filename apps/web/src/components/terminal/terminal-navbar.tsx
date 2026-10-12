'use client';

import Link from 'next/link';
import { useTheme } from '@/lib/use-theme';

const items = [
  { label: 'Trade', active: true, d: 'M3 17l5-6 4 4 8-9M15 6h5v5' },
  { label: 'Help', d: 'M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-1 .8-1 1.7M12 17h.01' },
  { label: 'Account', d: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5' },
  { label: 'Agent', d: 'M5 10h14l1 10H4L5 10zM9 10V8a3 3 0 0 1 6 0v2M12 14v3M9.5 14h.01M14.5 14h.01' },
  { label: 'More', d: 'M12 5h.01M12 12h.01M12 19h.01' },
];

export function TerminalNavbar({ hidden = false }: { hidden?: boolean }) {
  const { theme, toggle } = useTheme();

  return (
    <nav
      className={`sticky bottom-0 left-0 right-0 z-40 grid w-full shrink-0 grid-cols-6 overflow-hidden rounded-2xl border border-neo-line bg-neo-panel transition-all duration-300 ease-out lg:hidden ${
        hidden ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
      }`}
    >
      {items.map(({ label, active, d }) => (
        <Link
          key={label}
          href={label === 'Trade' ? '/trade' : '/'}
          className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition-colors ${
            active ? 'text-neo-text' : 'text-neo-mut hover:text-neo-text'
          }`}
        >
          <span className="relative">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {label === 'Help' ? (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d={d} />
                </>
              ) : (
                <path d={d} />
              )}
            </svg>
            {active && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-500" />}
            {label === 'More' && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
                4
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}

      <button
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        className="flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold text-neo-mut transition-colors hover:text-neo-text"
      >
        <span className="relative">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </span>
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </nav>
  );
}