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
    <div className="flex w-full shrink-0 flex-col items-center gap-2 pb-3 pt-2">
      <div className="flex w-[60px] items-center justify-between">
        <button
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={`grid h-7 w-7 place-items-center rounded-lg border border-white/5 bg-white/[0.04] text-neo-mut transition-all hover:border-sky-400/40 hover:text-sky-300 ${flash === 'fullscreen' ? 'border-sky-400/40 text-sky-300 shadow-[0_0_14px_-4px_rgba(56,189,248,0.8)]' : ''}`}
        >
          <IC d={fullscreen ? 'M10 4H5a1 1 0 0 0-1 1v5M14 4h5a1 1 0 0 1 1 1v5M10 20H5a1 1 0 0 1-1-1v-5M14 20h5a1 1 0 0 0 1-1v-5' : 'M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4'} />
        </button>
        <button
          onClick={goBack}
          title="Back"
          aria-label="Back"
          className="grid h-7 w-7 place-items-center rounded-lg border border-white/5 bg-white/[0.04] text-neo-mut transition-all hover:border-sky-400/40 hover:text-sky-300"
        >
          <IC d="M4 12a9 9 0 1 0 3-6.7M4 4v5h5" />
        </button>
      </div>

      <div className="flex w-[60px] items-center justify-between">
        <button
          onClick={() => bump('settings', onOpenSettings)}
          title="Settings"
          aria-label="Settings"
          className={`grid h-7 w-7 place-items-center rounded-lg border border-white/5 bg-white/[0.04] text-neo-mut transition-all hover:border-violet-400/40 hover:text-violet-300 ${flash === 'settings' ? 'border-violet-400/40 text-violet-300 shadow-[0_0_14px_-4px_rgba(167,139,250,0.8)]' : ''}`}
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
          className={`grid h-7 w-7 place-items-center rounded-lg border border-white/5 bg-white/[0.04] text-neo-mut transition-all hover:text-emerald-300 ${
            muted ? 'border-rose-400/40 text-rose-400 shadow-[0_0_14px_-4px_rgba(251,113,133,0.8)]' : 'hover:border-emerald-400/40'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" fillOpacity={0.25} />
            {muted ? (
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
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
        className={`flex h-11 w-[66px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-blue-400/30 bg-gradient-to-b from-blue-500/20 to-blue-600/10 shadow-[0_8px_24px_-8px_rgba(59,130,246,0.7)] transition-all hover:-translate-y-0.5 hover:border-blue-300/50 hover:shadow-[0_10px_30px_-8px_rgba(59,130,246,0.9)] active:scale-[0.97] ${flash === 'join' ? 'brightness-125' : ''}`}
        aria-label="Join us"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#7db1ff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6a2.5 2.5 0 0 1 2.5-2.5h8A2.5 2.5 0 0 1 17 6v4.5a2.5 2.5 0 0 1-2.5 2.5H11l-3.5 2.9V13H6.5A2.5 2.5 0 0 1 4 10.5V6z" />
          <path d="M17 9.5h1.5A2.5 2.5 0 0 1 21 12v3.5a2.5 2.5 0 0 1-2.5 2.5H17v2.6l-3.5-2.6h-2" />
        </svg>
        <span className="text-[8px] font-extrabold uppercase tracking-[0.1em] text-white">Join us</span>
      </button>

      <button
        onClick={() => bump('help', onHelpClick)}
        className="flex h-9 w-[66px] flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.7)] transition-all hover:-translate-y-0.5 hover:border-emerald-300/50 hover:shadow-[0_10px_30px_-8px_rgba(16,185,129,0.9)] active:scale-[0.97]"
        aria-label="Help"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
          <circle cx="12" cy="12" r="4" fill="#fff" />
        </svg>
        <span className="text-[8px] font-bold tracking-[0.04em] text-white">Help</span>
      </button>
    </div>
  );
}