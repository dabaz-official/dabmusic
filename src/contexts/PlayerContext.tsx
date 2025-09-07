'use client';

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { Song } from '@/lib/albums';
import Player from '@/components/Player';

interface PlayerContextType {
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  hasPlayed: boolean;
  setHasPlayed: (played: boolean) => void;
  currentSongs: Song[];
  setCurrentSongs: (songs: Song[]) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean | ((prev: boolean) => boolean)) => void;
  playerRef: React.RefObject<{ startPlay: () => void } | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentSongs, setCurrentSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  // 使用 useCallback 稳定函数引用
  const stableSetCurrentSongIndex = useCallback((index: number) => {
    setCurrentSongIndex(index);
  }, []);

  const stableSetIsPlaying = useCallback((playing: boolean | ((prev: boolean) => boolean)) => {
    setIsPlaying(playing);
  }, []);

  const stableSetIsShuffle = useCallback((shuffle: boolean | ((prev: boolean) => boolean)) => {
    setIsShuffle(shuffle);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSongIndex,
        setCurrentSongIndex: stableSetCurrentSongIndex,
        hasPlayed,
        setHasPlayed,
        currentSongs,
        setCurrentSongs,
        isPlaying,
        setIsPlaying: stableSetIsPlaying,
        isShuffle,
        setIsShuffle: stableSetIsShuffle,
        playerRef,
      }}
    >
      {children}
      {hasPlayed && currentSongs.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <Player
            ref={playerRef}
            songs={currentSongs}
            currentIndex={currentSongIndex}
            setCurrentIndex={stableSetCurrentSongIndex}
            isPlaying={isPlaying}
            setIsPlaying={stableSetIsPlaying}
            isShuffle={isShuffle}
            setIsShuffle={stableSetIsShuffle}
          />
        </div>
      )}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
