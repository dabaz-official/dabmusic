'use client';

import React, { useRef, useEffect } from 'react';
import { usePlayer } from "@dabaz/components/providers/PlayerProvider";
import { Song } from '@dabaz/lib/songs';

export interface AudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onEnded: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ onEnded, onTimeUpdate }) => {
  const { currentSong, isPlaying, updateProgress, handleNext } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);

  const getCurrentTime = () => {
    return audioRef.current ? audioRef.current.currentTime : 0;
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      updateProgress(audioRef.current.currentTime, audioRef.current.duration);
    }
  };

  return (
    <audio
      ref={audioRef}
      src={currentSong?.url || ''}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleNext}
    />
  );
};

export default AudioPlayer;