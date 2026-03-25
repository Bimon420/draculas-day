import { useEffect, useRef } from 'react';

export type AudioTrack = 'title' | 'gameplay' | 'none';

const TRACKS: Record<string, string> = {
  title: '/audio/title.mp3',
  gameplay: '/audio/gameplay.mp3',
};

export const useAudio = (track: AudioTrack) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<AudioTrack>('none');
  const unlockedRef = useRef(false);

  // Initialize audio object once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;

    const handleInteraction = () => {
      if (!unlockedRef.current) {
        unlockedRef.current = true;
        // If we have a track set, try playing it now that we're unlocked
        if (trackRef.current !== 'none') {
          audioRef.current?.play().catch(() => {});
        }
        cleanup();
      }
    };

    const cleanup = () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Update track when it changes
  useEffect(() => {
    if (track === trackRef.current || !audioRef.current) return;
    
    trackRef.current = track;

    if (track === 'none') {
      audioRef.current.pause();
      return;
    }

    const src = TRACKS[track];
    if (src) {
      audioRef.current.src = src;
      audioRef.current.volume = track === 'title' ? 0.45 : 0.4;
      
      // Try playing (might be blocked)
      audioRef.current.play().catch(() => {
        // Silently fail if blocked, the global interaction listener will handle it
      });
    }
  }, [track]);
};
