'use client';

import { createContext, useContext, useRef, useState, ReactNode } from 'react';
import { Song } from '@/lib/albums';
import Player from '@/components/Player';

interface PlayerContextType {
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  hasPlayed: boolean;
  setHasPlayed: (played: boolean) => void;
  currentSongs: Song[];
  setCurrentSongs: (songs: Song[]) => void;
  playerRef: React.RefObject<{ startPlay: () => void } | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentSongs, setCurrentSongs] = useState<Song[]>([]);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  return (
    <PlayerContext.Provider
      value={{
        currentSongIndex,
        setCurrentSongIndex,
        hasPlayed,
        setHasPlayed,
        currentSongs,
        setCurrentSongs,
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
            setCurrentIndex={setCurrentSongIndex}
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
