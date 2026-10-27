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

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  queue: Song[];
  currentSong: Song | null;
  currentAlbum: Album | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /** 0..1 */
  volume: number;
  /** Live ref to the audio element — for per-frame readouts (e.g. spin). */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Plays a song; its album becomes the queue. */
  play: (song: Song, album: Album) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  changeVolume: (value: number) => void;
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
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [volume, setVolume] = useState(1);

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
      if (currentIndex < 0 || queue.length === 0) return;

      // Shuffle: any other track at random (a one-track queue just repeats).
      if (shuffle && queue.length > 1) {
        let pick = currentIndex;
        while (pick === currentIndex) {
          pick = Math.floor(Math.random() * queue.length);
        }
        goToIndex(pick, true);
        return;
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        // Auto-advance stops at the end unless repeat-all; a manual next
        // always wraps.
        if (auto && repeat !== "all") {
          setIsPlaying(false);
          return;
        }
        goToIndex(0, true);
        return;
      }
      goToIndex(nextIndex, true);
    },
    [queue.length, currentIndex, shuffle, repeat, goToIndex],
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

  const toggleShuffle = useCallback(() => {
    setShuffle((isShuffle) => !isShuffle);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  }, []);

  const changeVolume = useCallback((value: number) => {
    setVolume(Math.min(1, Math.max(0, value)));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Repeat-one loops on the element itself, so `ended` never fires for it.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = repeat === "one";
  }, [repeat]);

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

  // Space toggles playback, unless focus sits on something that needs the
  // key itself: text fields keep their space, and focused buttons/links
  // activate natively (skipping avoids a double toggle).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.closest("button, a, [role='button']"))
      ) {
        return;
      }
      if (!currentSong) return;
      event.preventDefault();
      setIsPlaying((playing) => !playing);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentSong]);

  const value: PlayerContextValue = {
    queue,
    currentSong,
    currentAlbum,
    isPlaying,
    currentTime,
    duration,
    shuffle,
    repeat,
    volume,
    audioRef,
    play,
    togglePlay,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeat,
    changeVolume,
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
