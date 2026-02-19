import { useEffect, useRef } from 'react';

export function useAudioPlayer(musicUrl: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!musicUrl) return;

    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Auto-play (browsers may block, so we try on user interaction too)
    const playAudio = () => {
      audio.play().catch(() => {
        // Will retry on next user interaction
      });
    };

    playAudio();

    // Fallback: play on any user interaction
    const handleInteraction = () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [musicUrl]);

  return audioRef;
}
