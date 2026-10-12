'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/use-theme';

const IC = ({ d, className = 'h-4 w-4' }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export function TerminalToolbar({
  onOpenSettings,
  onJoinUsClick,
  onHelpClick,
}: {
  onOpenSettings?: () => void;
  onJoinUsClick?: () => void;
  onHelpClick?: () => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState('');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  const bump = (key: string, handler?: () => void) => {
    if (handler) {
      handler();
      return;
    }
    setFlash(key);
    window.setTimeout(() => setFlash(''), 600);
  };

  const iconBtn = (on: boolean) =>
    `grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neo-mut transition-colors hover:bg-neo-hover hover:text-neo-text ${
      on ? 'bg-neo-hover text-neo-text' : ''
    }`;

  return (
    <div className="flex w-full shrink-0 flex-col items-stretch gap-1.5 px-1.5 pb-2 pt-1.5">
      <div className="flex w-full items-center justify-between">
        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={iconBtn(flash === 'fullscreen')}
        >
          <IC d={fullscreen ? 'M10 4H5a1 1 0 0 0-1 1v5M14 4h5a1 1 0 0 1 1 1v5M10 20H5a1 1 0 0 1-1-1v-5M14 20h5a1 1 0 0 0 1-1v-5' : 'M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4'} />
        </button>
        <button
          onClick={goBack}
          title="Back"
          aria-label="Back"
          className={iconBtn(false)}
        >
          <IC d="M4 12a9 9 0 1 0 3-6.7M4 4v5h5" />
        </button>
        <button
          onClick={() => bump('settings', onOpenSettings)}
          title="Settings"
          aria-label="Settings"
          className={iconBtn(flash === 'settings')}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h8M16 18h4" />
            <circle cx="15" cy="6" r="1.9" />
            <circle cx="8" cy="12" r="1.9" />
            <circle cx="13" cy="18" r="1.9" />
          </svg>
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors ${
            muted ? 'bg-neo-hover text-rose-500 hover:bg-neo-inner' : 'text-neo-mut hover:bg-neo-hover hover:text-neo-text'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" fillOpacity={0.25} />
            {muted ? (
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
            ) : (
              <path d="M15.5 8.5a4.2 4.2 0 0 1 0 7M18.5 6.5a8 8 0 0 1 0 11" />
            )}
          </svg>
        </button>
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className={iconBtn(false)}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>

      <button
        onClick={() => bump('join', onJoinUsClick)}
        className={`flex h-9 w-full flex-row items-center justify-center gap-1.5 rounded-lg border border-[var(--join-line)] bg-[var(--join-bg)] text-[var(--join-tx)] transition-colors hover:brightness-110 active:brightness-125 ${flash === 'join' ? 'brightness-125' : ''}`}
        aria-label="Join us"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h8A2.5 2.5 0 0 1 17 6v4.5a2.5 2.5 0 0 1-2.5 2.5H11l-3.5 2.9V13H6.5A2.5 2.5 0 0 1 4 10.5V6z" />
          <path d="M17 9.5h1.5A2.5 2.5 0 0 1 21 12v3.5a2.5 2.5 0 0 1-2.5 2.5H17v2.6l-3.5-2.6h-2" />
        </svg>
        <span className="text-[10px] font-bold tracking-[0.08em]">Join us</span>
      </button>

      <button
        onClick={() => bump('help', onHelpClick)}
        className="flex h-8 w-full flex-row items-center justify-center gap-1.5 rounded-lg border border-[var(--help-line)] bg-[var(--help-bg)] text-[var(--help-tx)] transition-colors hover:brightness-110 active:brightness-125"
        aria-label="Help"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
        <span className="text-[10px] font-bold tracking-[0.04em]">Help</span>
      </button>
    </div>
  );
}