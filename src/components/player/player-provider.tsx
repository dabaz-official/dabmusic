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

import { AnimatePresence } from "motion/react";

import { FullscreenPlayer } from "./fullscreen-player";
import { MiniPlayerBar } from "./mini-player-bar";
import { readPlayerState, writePlayerState } from "./player-storage";
import { useMediaSession } from "./use-media-session";

export type RepeatMode = "off" | "all" | "one";

/** Past this many seconds "previous" restarts the track instead of going back. */
const PREVIOUS_RESTART_SECONDS = 3;

/** `timeupdate` fires about four times a second; this is one write per slice. */
const SAVE_INTERVAL_MS = 2000;

/** Queue indices the current shuffle cycle has not reached yet. */
function unplayedIndexes(length: number, played: Set<number>): number[] {
  const remaining: number[] = [];
  for (let index = 0; index < length; index += 1) {
    if (!played.has(index)) remaining.push(index);
  }
  return remaining;
}

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
  /** Whether the full-screen player is open. */
  isExpanded: boolean;
  /** Live ref to the audio element — for per-frame readouts (e.g. spin). */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Plays a song; its album becomes the queue. */
  play: (song: Song, album: Album) => void;
  togglePlay: () => void;
  /** Explicit pause/resume — used while scrubbing, so it never toggles. */
  setPlaying: (playing: boolean) => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  changeVolume: (value: number) => void;
  /** Silences the player; a second call restores the interrupted level. */
  toggleMute: () => void;
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
 * survives navigation, and it mirrors itself into `localStorage`
 * (`dabmusic.player.v1`) so a reload — or a PWA cold start — comes back to the
 * same album, track, position, volume and shuffle/repeat mode. A restored
 * session never autoplays: browsers reject playback outside a gesture.
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
  const [isExpanded, setExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  /** Tracks already consumed by the current shuffle cycle. */
  const playedRef = useRef<Set<number>>(new Set());
  /** Where shuffle came from, newest last — what "previous" pops. */
  const historyRef = useRef<number[]>([]);
  /** Position to apply once metadata arrives; set only right after a restore. */
  const pendingPositionRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const lastSavedAtRef = useRef(0);
  const persistRef = useRef<() => void>(() => {});

  const currentSong = currentIndex >= 0 ? (queue[currentIndex] ?? null) : null;

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const goToIndex = useCallback((index: number, autoplay: boolean) => {
    // A deliberate track change supersedes a position waiting to be restored.
    pendingPositionRef.current = null;
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
      // A new queue starts a new shuffle cycle, at this track.
      playedRef.current = shuffle ? new Set([index]) : new Set();
      historyRef.current = [];
      setQueue(songs);
      setCurrentAlbum(album);
      goToIndex(index, true);
    },
    [goToIndex, shuffle],
  );

  const advance = useCallback(
    (auto: boolean) => {
      if (currentIndex < 0 || queue.length === 0) return;

      if (shuffle) {
        // Draw from what the cycle has not reached yet, so an album actually
        // finishes instead of looping forever on Repeat Off.
        const played = playedRef.current;
        played.add(currentIndex);
        let candidates = unplayedIndexes(queue.length, played);

        if (candidates.length === 0) {
          if (auto && repeat === "off") {
            setIsPlaying(false);
            return;
          }
          // Repeat All, or a manual next at the end of the cycle: draw again.
          played.clear();
          played.add(currentIndex);
          candidates = unplayedIndexes(queue.length, played);
        }

        if (candidates.length === 0) {
          // A one-track album has nowhere else to go.
          goToIndex(currentIndex, true);
          return;
        }

        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        historyRef.current.push(currentIndex);
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

    // Past three seconds "previous" means "start this track over". The
    // full-screen player and the bar share this one handler.
    const audio = audioRef.current;
    if (audio && audio.currentTime > PREVIOUS_RESTART_SECONDS) {
      seek(0);
      return;
    }

    if (shuffle) {
      const from = historyRef.current.pop();
      if (from !== undefined) {
        goToIndex(from, isPlaying);
        return;
      }
      // Nothing played before this one in the cycle: restart rather than jump
      // to an unheard neighbour, which is what queue order used to do.
      seek(0);
      return;
    }

    if (currentIndex > 0) {
      goToIndex(currentIndex - 1, isPlaying);
      return;
    }
    // Head of the queue: wrap only when repeat-all asks for it.
    if (repeat === "all") goToIndex(queue.length - 1, isPlaying);
  }, [currentIndex, queue.length, isPlaying, shuffle, repeat, goToIndex, seek]);

  const togglePlay = useCallback(() => {
    if (currentIndex >= 0) setIsPlaying((playing) => !playing);
  }, [currentIndex]);

  const setPlaying = useCallback(
    (playing: boolean) => {
      if (currentIndex >= 0) setIsPlaying(playing);
    },
    [currentIndex],
  );

  const toggleShuffle = useCallback(() => {
    const enabled = !shuffle;
    // Turning shuffle on starts a fresh cycle at the current track; turning it
    // off drops the bookkeeping so nothing stale survives the next enable.
    playedRef.current =
      enabled && currentIndex >= 0 ? new Set([currentIndex]) : new Set();
    historyRef.current = [];
    setShuffle(enabled);
  }, [shuffle, currentIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeat((mode) => (mode === "off" ? "all" : mode === "all" ? "one" : "off"));
  }, []);

  const changeVolume = useCallback((value: number) => {
    setVolume(Math.min(1, Math.max(0, value)));
  }, []);

  /** Last level that was audible, so unmuting returns to it rather than guessing. */
  const lastAudibleVolume = useRef(1);
  useEffect(() => {
    if (volume > 0) lastAudibleVolume.current = volume;
  }, [volume]);

  /** Silences the player; a second call restores the interrupted level. */
  const toggleMute = useCallback(() => {
    setVolume((current) => {
      if (current > 0) {
        lastAudibleVolume.current = current;
        return 0;
      }
      return lastAudibleVolume.current || 1;
    });
  }, []);

  /**
   * Snapshot of everything worth keeping. The position comes from the mirrored
   * state rather than the element: right after a track switch the element still
   * reports the outgoing track's time, and a restore that has not been applied
   * yet owns the position outright.
   */
  const persist = useCallback(() => {
    if (!currentAlbum || currentIndex < 0) return;

    writePlayerState({
      version: 1,
      album: currentAlbum,
      index: currentIndex,
      position: pendingPositionRef.current ?? currentTime,
      volume,
      shuffle,
      repeat,
      played: [...playedRef.current],
      history: [...historyRef.current],
    });
    lastSavedAtRef.current = Date.now();
  }, [currentAlbum, currentIndex, currentTime, volume, shuffle, repeat]);

  // Keep the flushers pointing at the latest closure without re-subscribing.
  useEffect(() => {
    persistRef.current = persist;
  });

  // Restore once, after mount: storage is not readable during render without
  // breaking hydration, and the queue has to exist before the element loads.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const stored = readPlayerState();
    if (!stored) return;

    playedRef.current = new Set(stored.played);
    historyRef.current = [...stored.history];
    // Applied on `loadedmetadata` — the element has no duration before that.
    pendingPositionRef.current = stored.position;

    /* eslint-disable react-hooks/set-state-in-effect -- Storage is unreadable
       during render (hydration mismatch), so the snapshot can only land in an
       effect; this is the hydrate-from-external-store case, not a cascade. */
    setQueue(stored.album.tracks);
    setCurrentAlbum(stored.album);
    setCurrentIndex(stored.index);
    setCurrentTime(stored.position);
    setVolume(stored.volume);
    setShuffle(stored.shuffle);
    setRepeat(stored.repeat);
    // Never autoplay a restore — the browser would reject it anyway.
    setIsPlaying(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // State changes are user-scale events, so they are written straight away;
  // only the position stream is throttled (in `onTimeUpdate`).
  useEffect(() => {
    persistRef.current();
  }, [currentAlbum, currentIndex, volume, shuffle, repeat]);

  // Otherwise the last couple of seconds never reach storage when the tab is
  // closed or backgrounded.
  useEffect(() => {
    const flush = () => persistRef.current();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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

  // Stable handlers: Media Session re-registers its action handlers whenever
  // these change, so they must not be recreated on every render.
  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  useMediaSession({
    song: currentSong,
    albumTitle: currentAlbum?.title ?? null,
    artist: currentSong ? (currentSong.artist ?? currentAlbum?.artist ?? null) : null,
    cover: currentSong ? (currentSong.cover ?? currentAlbum?.cover ?? null) : null,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    onPlay: handlePlay,
    onPause: handlePause,
    onNext: next,
    onPrevious: previous,
    onSeek: seek,
  });

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
    isExpanded,
    audioRef,
    play,
    togglePlay,
    setPlaying,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeat,
    changeVolume,
    toggleMute,
    setExpanded,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <MiniPlayerBar />
      <AnimatePresence>
        {currentSong && isExpanded && <FullscreenPlayer key="fullscreen" />}
      </AnimatePresence>
      <audio
        ref={audioRef}
        src={currentSong?.src}
        preload="metadata"
        onLoadStart={() => {
          // A restore already put a position on screen; keep it until metadata
          // lands and the element can actually seek there.
          if (pendingPositionRef.current === null) setCurrentTime(0);
          setDuration(0);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
          if (Date.now() - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
            persistRef.current();
          }
        }}
        onLoadedMetadata={(event) => {
          const audio = event.currentTarget;
          const loaded = audio.duration;
          if (Number.isFinite(loaded)) setDuration(loaded);

          const pending = pendingPositionRef.current;
          if (pending === null) return;
          pendingPositionRef.current = null;
          // Stop a hair short of the end so a restored "finished" track does
          // not immediately fire `ended` and skip itself.
          const target = Number.isFinite(loaded)
            ? Math.min(pending, Math.max(loaded - 0.25, 0))
            : pending;
          try {
            audio.currentTime = target;
            setCurrentTime(target);
          } catch {
            // A track shorter than we remembered just starts from the top.
            setCurrentTime(0);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => advance(true)}
      />
    </PlayerContext.Provider>
  );
}
