import { useEffect, useRef } from 'react';

export type AudioTrack = 'title' | 'gameplay' | 'none';

const TRACKS: Record<string, string> = {
  title: '/audio/title.mp3',
  gameplay: '/audio/gameplay.mp3',
};

const VOLUMES: Record<string, number> = {
  title: 0.45,
  gameplay: 0.4,
};

// Singleton audio element to survive across React strict-mode remounts
let globalAudio: HTMLAudioElement | null = null;
let globalInteractionCleanup: (() => void) | null = null;

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.loop = true;
    globalAudio.preload = 'auto';
  }
  return globalAudio;
}

function clearInteractionListeners() {
  if (globalInteractionCleanup) {
    globalInteractionCleanup();
    globalInteractionCleanup = null;
  }
}

function setupInteractionRetry(audio: HTMLAudioElement) {
  clearInteractionListeners();

  const tryPlay = () => {
    audio.play().catch(() => {/* still blocked */});
    clearInteractionListeners();
  };

  const events = ['click', 'keydown', 'touchstart', 'pointerdown'] as const;
  events.forEach(e => window.addEventListener(e, tryPlay, { once: false }));

  globalInteractionCleanup = () => {
    events.forEach(e => window.removeEventListener(e, tryPlay));
  };
}

export const useAudio = (track: AudioTrack) => {
  const trackRef = useRef<AudioTrack>('none');

  useEffect(() => {
    const audio = getAudio();

    // Same track already playing → nothing to do
    if (track === trackRef.current) return;
    trackRef.current = track;

    clearInteractionListeners();

    if (track === 'none') {
      audio.pause();
      return;
    }

    const src = TRACKS[track];
    if (!src) return;

    // Only reload if source changed
    const newSrc = new URL(src, window.location.href).href;
    const currentSrc = audio.src;

    audio.volume = VOLUMES[track] ?? 0.4;

    if (currentSrc !== newSrc) {
      audio.src = src;
      audio.load();
    }

    const attemptPlay = () => {
      const p = audio.play();
      if (p) {
        p.catch(() => {
          // Autoplay blocked — wait for user gesture
          setupInteractionRetry(audio);
        });
      }
    };

    // Small delay so the browser can start buffering
    const t = setTimeout(attemptPlay, 100);
    return () => clearTimeout(t);
  }, [track]);

  // No cleanup on unmount — audio continues (singleton pattern)
};
