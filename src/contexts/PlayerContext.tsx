'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Song } from '@/lib/albums';
import Player from '@/components/player/Player';

interface PlayOptions {
  /** Identifies the source list, so a view can tell whether it is the active queue. */
  id?: string | null;
  /** Leave undefined to keep the listener's current shuffle preference. */
  shuffle?: boolean;
}

interface PlayerContextValue {
  queue: Song[];
  queueId: string | null;
  index: number;
  currentSong: Song | null;
  isPlaying: boolean;
  isShuffle: boolean;
  hasPlayed: boolean;
  playQueue: (songs: Song[], startIndex: number, options?: PlayOptions) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueId, setQueueId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const playQueue = useCallback((songs: Song[], startIndex: number, options?: PlayOptions) => {
    setQueue(songs);
    setQueueId(options?.id ?? null);
    setIndex(startIndex);
    if (options?.shuffle !== undefined) setIsShuffle(options.shuffle);
    setHasPlayed(true);
    setIsPlaying(true);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const length = queue.length;
      if (length === 0) return;

      if (length > 1) {
        if (isShuffle) {
          let target = index;
          while (target === index) target = Math.floor(Math.random() * length);
          setIndex(target);
        } else {
          setIndex((index + direction + length) % length);
        }
      }
      // A single-track queue just replays itself.
      setIsPlaying(true);
    },
    [queue.length, index, isShuffle],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);
  const togglePlay = useCallback(() => setIsPlaying((playing) => !playing), []);
  const toggleShuffle = useCallback(() => setIsShuffle((shuffle) => !shuffle), []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      queueId,
      index,
      currentSong: queue[index] ?? null,
      isPlaying,
      isShuffle,
      hasPlayed,
      playQueue,
      setPlaying: setIsPlaying,
      togglePlay,
      next,
      previous,
      toggleShuffle,
    }),
    [queue, queueId, index, isPlaying, isShuffle, hasPlayed, playQueue, togglePlay, next, previous, toggleShuffle],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {hasPlayed && queue.length > 0 && <Player />}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
