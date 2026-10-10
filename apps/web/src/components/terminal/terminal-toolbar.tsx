'use client';

import { useEffect, useState } from 'react';

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
      <div className="flex w-[56px] items-center justify-between">
        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={`grid h-6 w-6 place-items-center rounded text-qt-mut transition-colors hover:bg-qt-hover ${flash === 'fullscreen' ? 'bg-qt-hover text-white' : ' hover:text-white'}`}
        >
          <IC d={fullscreen ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4'} />
        </button>
        <button
          onClick={goBack}
          title="Back"
          aria-label="Back"
          className="grid h-6 w-6 place-items-center rounded text-qt-mut transition-colors hover:bg-qt-hover hover:text-white"
        >
          <IC d="M20 12H4M11 5l-7 7 7 7" />
        </button>
      </div>

      <div className="flex w-[56px] items-center justify-between">
        <button
          onClick={() => bump('settings', onOpenSettings)}
          title="Settings"
          aria-label="Settings"
          className={`grid h-6 w-6 place-items-center rounded text-qt-mut transition-colors hover:bg-qt-hover ${flash === 'settings' ? 'bg-qt-hover text-white' : ' hover:text-white'}`}
        >
          <IC d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.3 1a7 7 0 0 0-2-1.2L14.5 2h-5l-.1 2.6a7 7 0 0 0-2 1.2l-2.3-1-2 3.5 2 1.5A7 7 0 0 0 5 12" />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          title={muted ? 'Unmute' : 'Mute'}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          className="grid h-6 w-6 place-items-center rounded text-qt-mut transition-colors hover:bg-qt-hover hover:text-white"
        >
          <IC d={muted ? 'M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6' : 'M11 5 6 9H3v6h3l5 4zM16 9a4 4 0 0 1 0 6'} />
        </button>
      </div>

      <button
        onClick={() => bump('join', onJoinUsClick)}
        className={`flex h-7 w-[62px] items-center justify-center gap-1 rounded-md bg-[#2b5ae8] text-[8px] font-extrabold uppercase tracking-[0.06em] text-white transition hover:brightness-110 active:scale-[0.97] ${flash === 'join' ? 'brightness-125' : ''}`}
      >
        <IC d="M4 5h16v11H8l-4 4z" className="h-3 w-3" />
        Join us
      </button>

      <button
        onClick={() => bump('help', onHelpClick)}
        className="relative flex h-7 w-[62px] items-center justify-center gap-1 rounded-md bg-qt-up text-[8px] font-extrabold uppercase tracking-[0.06em] text-white transition hover:brightness-110 active:scale-[0.97]"
      >
        <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-white" />
        Help
      </button>
    </div>
  );
}