"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { Song } from "@/lib/types";

import { MiniPlayerBar } from "./mini-player-bar";
import { FullscreenPlayer } from "./fullscreen-player";
import { useMediaSession } from "./use-media-session";

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  queue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  isExpanded: boolean;
  /** Starts a song; pass its album's tracks to make that the queue. */
  play: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  changeVolume: (value: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  setExpanded: (expanded: boolean) => void;
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
 * survives navigation.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [isExpanded, setExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAudibleVolume = useRef(1);
  /** Indices played, so `previous()` can retrace a shuffled path. */
  const historyRef = useRef<number[]>([]);

  const currentSong = currentIndex >= 0 ? (queue[currentIndex] ?? null) : null;

  const goToIndex = useCallback((index: number, autoplay: boolean) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    if (autoplay) setIsPlaying(true);
  }, []);

  const play = useCallback(
    (song: Song, songs?: Song[]) => {
      const nextQueue = songs ?? [song];
      const index = Math.max(
        nextQueue.findIndex((candidate) => candidate.id === song.id),
        0,
      );
      setQueue(nextQueue);
      historyRef.current = [index];
      goToIndex(index, true);
    },
    [goToIndex],
  );

  const advance = useCallback(
    (auto: boolean) => {
      if (queue.length <= 1 && currentIndex >= 0) {
        if (auto) setIsPlaying(false);
        return;
      }

      let nextIndex: number;
      if (shuffle) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex);
      } else {
        nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          if (auto && repeat !== "all") {
            setIsPlaying(false);
            return;
          }
          nextIndex = 0;
        }
      }

      if (currentIndex >= 0) historyRef.current.push(currentIndex);
      goToIndex(nextIndex, true);
    },
    [queue, currentIndex, shuffle, repeat, goToIndex],
  );

  const next = useCallback(() => advance(false), [advance]);

  const previous = useCallback(() => {
    const history = historyRef.current;
    const visited = history.length > 1 ? history.pop() : history[0];
    if (visited != null && visited !== currentIndex) {
      goToIndex(visited, isPlaying);
      return;
    }
    // Nothing retraceable: step back in queue order.
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

  const changeVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolume(clamped);
    setMuted(clamped === 0);
    if (clamped > 0) lastAudibleVolume.current = clamped;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((isMuted) => {
      if (isMuted && volume === 0) setVolume(lastAudibleVolume.current || 1);
      return !isMuted;
    });
  }, [volume]);

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((isShuffle) => !isShuffle);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Repeat-one loops inside the element, so `ended` never fires for it.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.loop = repeat === "one";
  }, [repeat]);

  useMediaSession({
    song: currentSong,
    isPlaying,
    duration,
    audioRef,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onNext: next,
    onPrevious: previous,
    onSeek: seek,
  });

  const value: PlayerContextValue = {
    queue,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    repeat,
    shuffle,
    isExpanded,
    play,
    togglePlay,
    next,
    previous,
    seek,
    changeVolume,
    toggleMute,
    cycleRepeat,
    toggleShuffle,
    setExpanded,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      {currentSong && <MiniPlayerBar />}
      {currentSong && isExpanded && <FullscreenPlayer />}
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
