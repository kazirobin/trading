'use client';

import Link from 'next/link';

const items = [
  { label: 'Trade', active: true },
  { label: 'Help' },
  { label: 'Account' },
  { label: 'Tournaments', badge: 4 },
  { label: 'More', badge: 4 },
];

export function TerminalNavbar() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-40 grid w-full shrink-0 grid-cols-5 border-t border-qt-line bg-qt-sidebar lg:hidden">
      {items.map(({ label, active, badge }) => (
        <Link
          key={label}
          href={label === 'Trade' ? '/trade' : '/'}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
            active ? 'text-qt-text' : 'text-qt-mut hover:text-qt-text'
          }`}
        >
          <span className="relative">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              {label === 'Trade' && <path d="M3 17l5-6 4 4 8-9M15 6h5v5" />}
              {label === 'Help' && (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-1 .8-1 1.7M12 17h.01" />
                </>
              )}
              {label === 'Account' && (
                <>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-3.2 4.3-5 8-5s6.5 1.8 8 5" />
                </>
              )}
              {label === 'Tournaments' && <path d="M8 21h8M12 17v4M6 3h12v3a6 6 0 0 1-12 0V3zM6 5H3a4 4 0 0 0 3 3.8M18 5h3a4 4 0 0 1-3 3.8" />}
              {label === 'More' && (
                <>
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </>
              )}
            </svg>
            {typeof badge === 'number' && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-qt-accent px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}