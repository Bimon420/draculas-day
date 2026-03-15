import { useEffect, useRef } from 'react';

export type AudioTrack = 'title' | 'gameplay' | 'none';

const TRACKS: Record<string, string> = {
  title: '/audio/title.mp3',
  gameplay: '/audio/gameplay.mp3',
};

export const useAudio = (track: AudioTrack) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<AudioTrack>('none');

  useEffect(() => {
    if (track === currentTrackRef.current) return;

    // Fade out then stop current track
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    currentTrackRef.current = track;

    if (track === 'none') return;

    const src = TRACKS[track];
    if (!src) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    audioRef.current.src = src;
    audioRef.current.loop = true;
    audioRef.current.volume = track === 'title' ? 0.6 : 0.55;

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — wait for first user interaction
        const unlock = () => {
          if (currentTrackRef.current === track) {
            audioRef.current?.play().catch(() => {});
          }
        };
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('pointerdown', unlock, { once: true });
      });
    }
  }, [track]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
};
