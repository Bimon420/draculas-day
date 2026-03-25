import React, { useRef, useCallback, useEffect } from 'react';

interface TouchControlsProps {
  keysRef: React.MutableRefObject<Set<string>>;
  gameState: string;
}

// Maps a logical key name to the Set value the engine checks
const KEY = {
  up: 'w',
  down: 's',
  left: 'a',
  right: 'd',
  dash: ' ',
  screech: 'Shift',
};

export const TouchControls: React.FC<TouchControlsProps> = ({ keysRef, gameState }) => {
  // Track which keys are currently held via touch so we can release them on touchend
  const heldKeys = useRef<Set<string>>(new Set());

  const press = useCallback((key: string) => {
    keysRef.current.add(key);
    heldKeys.current.add(key);
  }, [keysRef]);

  const release = useCallback((key: string) => {
    keysRef.current.delete(key);
    heldKeys.current.delete(key);
  }, [keysRef]);

  const releaseAll = useCallback(() => {
    heldKeys.current.forEach(k => keysRef.current.delete(k));
    heldKeys.current.clear();
  }, [keysRef]);

  // Release all held keys when game state changes (prevents stuck keys)
  useEffect(() => {
    releaseAll();
  }, [gameState, releaseAll]);

  if (gameState !== 'playing' && gameState !== 'bloodminigame') return null;

  // ── D-Pad ─────────────────────────────────────────────────────────────────
  const makeDPadProps = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); press(key); },
    onTouchEnd:   (e: React.TouchEvent) => { e.preventDefault(); release(key); },
    onTouchCancel:(e: React.TouchEvent) => { e.preventDefault(); release(key); },
  });

  // ── Action buttons ─────────────────────────────────────────────────────────
  const makeActionProps = (key: string) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); press(key); },
    onTouchEnd:   (e: React.TouchEvent) => { e.preventDefault(); release(key); },
    onTouchCancel:(e: React.TouchEvent) => { e.preventDefault(); release(key); },
  });

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* ── Left: D-Pad ──────────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-6 pointer-events-auto" style={{ touchAction: 'none' }}>
        <div className="relative w-32 h-32">
          {/* Up */}
          <button
            {...makeDPadProps(KEY.up)}
            className="absolute left-1/2 top-0 -translate-x-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 active:bg-white/25 backdrop-blur-sm text-white/70 text-lg"
            style={{ touchAction: 'none' }}
          >▲</button>
          {/* Down */}
          <button
            {...makeDPadProps(KEY.down)}
            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 active:bg-white/25 backdrop-blur-sm text-white/70 text-lg"
            style={{ touchAction: 'none' }}
          >▼</button>
          {/* Left */}
          <button
            {...makeDPadProps(KEY.left)}
            className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 active:bg-white/25 backdrop-blur-sm text-white/70 text-lg"
            style={{ touchAction: 'none' }}
          >◀</button>
          {/* Right */}
          <button
            {...makeDPadProps(KEY.right)}
            className="absolute top-1/2 right-0 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 active:bg-white/25 backdrop-blur-sm text-white/70 text-lg"
            style={{ touchAction: 'none' }}
          >▶</button>
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/10 border border-white/10" />
        </div>
      </div>

      {/* ── Right: Action buttons ─────────────────────────────────────── */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-end gap-3" style={{ touchAction: 'none' }}>
        {/* Screech (Shift) */}
        <button
          {...makeActionProps(KEY.screech)}
          className="w-14 h-14 rounded-full bg-red-900/50 border border-red-500/50 active:bg-red-600/70 backdrop-blur-sm flex flex-col items-center justify-center gap-0.5 shadow-[0_0_12px_rgba(220,38,38,0.3)]"
          style={{ touchAction: 'none' }}
        >
          <span className="text-red-300 text-[18px] leading-none">🔊</span>
          <span className="text-[8px] text-red-300 font-bold uppercase tracking-wider">Sonic</span>
        </button>
        {/* Dash (Space) */}
        <button
          {...makeActionProps(KEY.dash)}
          className="w-14 h-14 rounded-full bg-primary/30 border border-primary/50 active:bg-primary/60 backdrop-blur-sm flex flex-col items-center justify-center gap-0.5 shadow-[0_0_12px_rgba(153,27,27,0.3)]"
          style={{ touchAction: 'none' }}
        >
          <span className="text-primary text-[18px] leading-none">⚡</span>
          <span className="text-[8px] text-primary font-bold uppercase tracking-wider">Dash</span>
        </button>
      </div>
    </div>
  );
};
