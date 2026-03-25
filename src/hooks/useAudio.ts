import { useEffect, useRef } from 'react';

export type AudioTrack = 'title' | 'gameplay' | 'none';

const TRACK_SRCS: Record<string, string> = {
  title: '/audio/title.mp3',
  gameplay: '/audio/gameplay.mp3',
};

const TRACK_VOLUMES: Record<string, number> = {
  title: 0.45,
  gameplay: 0.4,
};

export const useAudio = (track: AudioTrack) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrack = useRef<AudioTrack>('none');
  const cleanupListeners = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Lazy-create audio element inside the effect (guaranteed before use)
    if (!audioRef.current) {
      const a = new Audio();
      a.loop = true;
      a.preload = 'auto';
      audioRef.current = a;
    }

    const audio = audioRef.current;

    // Remove any pending interaction listeners from previous attempt
    if (cleanupListeners.current) {
      cleanupListeners.current();
      cleanupListeners.current = null;
    }

    if (track === 'none') {
      audio.pause();
      loadedTrack.current = 'none';
      return;
    }

    const src = TRACK_SRCS[track];
    if (!src) return;

    // Load new source only when track changes
    if (loadedTrack.current !== track) {
      audio.pause();
      audio.src = src;
      audio.load();
      audio.volume = TRACK_VOLUMES[track] ?? 0.4;
      loadedTrack.current = track;
    }

    // Attempt playback
    const attempt = () => {
      const promise = audio.play();
      if (!promise) return; // old browsers — fire and forget

      promise.catch(() => {
        // Autoplay blocked — wait for next user gesture.
        // Handler must be synchronous so Safari counts it as user-initiated.
        const events = ['click', 'keydown', 'touchend', 'pointerdown'] as const;

        const handler = () => {
          events.forEach(e => window.removeEventListener(e, handler));
          cleanupListeners.current = null;
          audio.play().catch(() => {/* still blocked */});
        };

        events.forEach(e => window.addEventListener(e, handler, { once: true }));

        cleanupListeners.current = () => {
          events.forEach(e => window.removeEventListener(e, handler));
        };
      });
    };

    attempt();

    return () => {
      // Remove interaction listeners if the track changes before user clicks
      if (cleanupListeners.current) {
        cleanupListeners.current();
        cleanupListeners.current = null;
      }
    };
  }, [track]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);
};
