"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Album, Song } from "@/lib/types";

import { MiniPlayerBar } from "./mini-player-bar";

interface PlayerContextValue {
  queue: Song[];
  currentSong: Song | null;
  currentAlbum: Album | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** Plays a song; its album becomes the queue. */
  play: (song: Song, album: Album) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}

/**
 * The single client boundary that owns the `<audio>` element. Playback truth
 * lives on the element; React state mirrors only what the UI renders
 * (position, duration, requested playing flag) and is corrected by the
 * element's own play/pause events. Mounted in the root layout so the audio
 * survives navigation. Cut 1 of the rebuild: no shuffle, repeat, volume or
 * Media Session yet.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  const currentSong = currentIndex >= 0 ? (queue[currentIndex] ?? null) : null;

  const goToIndex = useCallback((index: number, autoplay: boolean) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    if (autoplay) setIsPlaying(true);
  }, []);

  const play = useCallback(
    (song: Song, album: Album) => {
      const songs = album.tracks;
      const index = Math.max(
        songs.findIndex((candidate) => candidate.id === song.id),
        0,
      );
      setQueue(songs);
      setCurrentAlbum(album);
      goToIndex(index, true);
    },
    [goToIndex],
  );

  const advance = useCallback(
    (auto: boolean) => {
      if (currentIndex < 0) return;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (auto) setIsPlaying(false);
        else goToIndex(0, true);
        return;
      }
      goToIndex(nextIndex, true);
    },
    [queue.length, currentIndex, goToIndex],
  );

  const next = useCallback(() => advance(false), [advance]);

  const previous = useCallback(() => {
    if (currentIndex < 0) return;
    goToIndex(currentIndex > 0 ? currentIndex - 1 : queue.length - 1, isPlaying);
  }, [currentIndex, queue.length, isPlaying, goToIndex]);

  const togglePlay = useCallback(() => {
    if (currentIndex >= 0) setIsPlaying((playing) => !playing);
  }, [currentIndex]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  // Drive the element from the requested playback state. `currentSong` is a
  // dependency so a track change starts playing without timeout juggling.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }
    const pending = audio.play();
    if (pending) {
      pending.catch((error: DOMException) => {
        // AbortError just means a newer load replaced this one.
        if (error.name !== "AbortError") setIsPlaying(false);
      });
    }
  }, [isPlaying, currentSong]);

  const value: PlayerContextValue = {
    queue,
    currentSong,
    currentAlbum,
    isPlaying,
    currentTime,
    duration,
    play,
    togglePlay,
    next,
    previous,
    seek,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {currentSong && <MiniPlayerBar />}
      <audio
        ref={audioRef}
        src={currentSong?.src}
        preload="metadata"
        onLoadStart={() => {
          setCurrentTime(0);
          setDuration(0);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const loaded = event.currentTarget.duration;
          if (Number.isFinite(loaded)) setDuration(loaded);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => advance(true)}
      />
    </PlayerContext.Provider>
  );
}
