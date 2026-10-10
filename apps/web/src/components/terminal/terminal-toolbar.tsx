'use client';

import { useEffect, useState } from 'react';

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

  return (
    <div className="mt-auto flex w-full flex-col items-center gap-2 pb-3 pt-3">
      <div className="flex w-[62px] items-center justify-between">
        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={`grid h-7 w-7 place-items-center rounded-md border border-qt-line/60 bg-qt-panel2/50 text-qt-mut transition-colors hover:border-qt-accent hover:text-qt-text ${flash === 'fullscreen' ? 'border-qt-accent bg-qt-accent/15 text-qt-accent' : 'hover:bg-qt-hover'}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            {fullscreen ? (
              <>
                <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                <path d="M9 9h0M15 15h0M9 15h0M15 9h0" strokeWidth={2.2} />
              </>
            ) : (
              <>
                <path d="M3 8V3h5M21 8V3h-5M21 16v5h-5M3 16v5h5" />
                <path d="M3 8h5M8 8V3M21 8h-5M16 8V3M21 16h-5M16 16v5M3 16h5M8 16v5" strokeWidth={1.2} opacity={0.7} />
              </>
            )}
          </svg>
        </button>
        <button
          onClick={goBack}
          title="Back"
          aria-label="Back"
          className="grid h-7 w-7 place-items-center rounded-md border border-qt-line/60 bg-qt-panel2/50 text-qt-mut transition-colors hover:border-qt-accent hover:bg-qt-hover hover:text-qt-text"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      <div className="flex w-[62px] items-center justify-between">
        <button
          onClick={() => bump('settings', onOpenSettings)}
          title="Settings"
          aria-label="Settings"
          className={`grid h-7 w-7 place-items-center rounded-md border border-qt-line/60 bg-qt-panel2/50 text-qt-mut transition-colors hover:border-qt-accent hover:text-qt-text ${flash === 'settings' ? 'border-qt-accent bg-qt-accent/15 text-qt-accent' : 'hover:bg-qt-hover'}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
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
          className={`grid h-7 w-7 place-items-center rounded-md border border-qt-line/60 bg-qt-panel2/50 text-qt-mut transition-colors hover:border-qt-accent hover:bg-qt-hover hover:text-qt-text ${muted ? 'text-qt-down' : ''}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" fillOpacity={0.25} />
            {muted ? (
              <>
                <path d="M16 9.5l5 5M21 9.5l-5 5" />
              </>
            ) : (
              <>
                <path d="M15.5 8.5a4.2 4.2 0 0 1 0 7M18.5 6.5a8 8 0 0 1 0 11" />
              </>
            )}
          </svg>
        </button>
      </div>

      <button
        onClick={() => bump('join', onJoinUsClick)}
        className={`flex h-10 w-[66px] flex-col items-center justify-center gap-1 rounded-[10px] bg-[#2b5ae8] shadow-[0_6px_16px_-4px_rgba(43,90,232,0.65)] transition hover:brightness-110 active:scale-[0.97] ${flash === 'join' ? 'brightness-125' : ''}`}
        aria-label="Join us"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#6EA8FF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h8A2.5 2.5 0 0 1 17 6v4.5a2.5 2.5 0 0 1-2.5 2.5H11l-3.5 2.9V13H6.5A2.5 2.5 0 0 1 4 10.5V6z" />
          <path d="M17 9.5h1.5A2.5 2.5 0 0 1 21 12v3.5a2.5 2.5 0 0 1-2.5 2.5H17v2.6l-3.5-2.6h-2" />
        </svg>
        <span className="text-[8px] font-extrabold uppercase tracking-[0.08em] text-white">Join us</span>
      </button>

      <button
        onClick={() => bump('help', onHelpClick)}
        className="flex h-10 w-[66px] flex-col items-center justify-center gap-1 rounded-[10px] bg-qt-up shadow-[0_6px_16px_-4px_rgba(15,175,89,0.65)] transition hover:brightness-110 active:scale-[0.97]"
        aria-label="Help"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <circle cx="12" cy="12" r="4" fill="#fff" />
        </svg>
        <span className="text-[8px] font-bold tracking-[0.02em] text-white">Help</span>
      </button>
    </div>
  );
}