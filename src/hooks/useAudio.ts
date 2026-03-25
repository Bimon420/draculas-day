import { useEffect, useRef } from 'react';

export type AudioTrack = 'title' | 'gameplay' | 'none';

const TRACKS: Record<string, string> = {
  title: '/audio/title.mp3',
  gameplay: '/audio/gameplay.mp3',
};

export const useAudio = (track: AudioTrack) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = useRef<AudioTrack>('none');

  useEffect(() => {
    // Get or create the audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;

    // Nothing to do if track hasn't changed
    if (track === currentTrack.current) return;
    currentTrack.current = track;

    if (track === 'none') {
      audio.pause();
      return;
    }

    const src = TRACKS[track];
    if (!src) return;

    audio.src = src;
    audio.volume = track === 'title' ? 0.45 : 0.4;

    // Attempt autoplay — browsers may block it until a user gesture
    const tryPlay = () => audio.play().catch(() => { /* blocked, will retry below */ });
    tryPlay();

    // If blocked, retry on the first user interaction
    const onInteraction = () => {
      tryPlay();
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('pointerdown', onInteraction);
    };
    window.addEventListener('click', onInteraction);
    window.addEventListener('keydown', onInteraction);
    window.addEventListener('touchstart', onInteraction);
    window.addEventListener('pointerdown', onInteraction);

    return () => {
      window.removeEventListener('click', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('touchstart', onInteraction);
      window.removeEventListener('pointerdown', onInteraction);
    };
  }, [track]);

  // Cleanup the audio element on unmount
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
