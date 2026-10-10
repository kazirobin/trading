'use client';

import Link from 'next/link';

const items = [
  { label: 'Trade', active: true, d: 'M3 17l5-6 4 4 8-9M15 6h5v5' },
  { label: 'Help', d: 'M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-1 .8-1 1.7M12 17h.01' },
  { label: 'Account', d: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5' },
  { label: 'Agent', d: 'M5 10h14l1 10H4L5 10zM9 10V8a3 3 0 0 1 6 0v2M12 14v3M9.5 14h.01M14.5 14h.01' },
  { label: 'More', d: 'M12 5h.01M12 12h.01M12 19h.01' },
];

export function TerminalNavbar() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 grid w-full shrink-0 grid-cols-5 rounded-2xl glass-strong lg:hidden">
      {items.map(({ label, active, d }) => (
        <Link
          key={label}
          href={label === 'Trade' ? '/trade' : '/'}
          className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[11px] font-semibold transition-colors ${
            active ? 'text-white' : 'text-neo-mut hover:text-white'
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
            {active && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_8px_2px_rgba(43,153,255,0.8)]" />}
            {label === 'More' && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-gradient-to-r from-sky-400 to-violet-500 px-1 text-[10px] font-bold text-white">
                4
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}