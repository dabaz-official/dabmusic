'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePlayer } from '@/contexts/PlayerContext';
import { useLyrics } from '@/hooks/useLyrics';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useMediaSession } from '@/hooks/useMediaSession';
import { findActiveLine } from '@/lib/lrc';
import DesktopPlayerModal from './DesktopPlayerModal';
import MobilePlayerSheet from './MobilePlayerSheet';
import PlayerBar from './PlayerBar';
import type { PlayerViewProps } from './types';

/** Highlight a line this many seconds early so it is readable when it is sung. */
const LYRIC_LEAD_SECONDS = 0.35;

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
};

export default function Player() {
  const { queue, currentSong, isPlaying, setPlaying, togglePlay, next, previous, isShuffle, toggleShuffle } =
    usePlayer();

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAudibleVolume = useRef(1);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 640px)');
  const lyrics = useLyrics(currentSong?.lyrics);
  const hasLyrics = Boolean(currentSong?.lyrics);
  // A track with no lyrics simply has no panel, so nothing has to close it.
  const lyricsOpen = isLyricsOpen && hasLyrics;

  const activeIndex = useMemo(
    () => findActiveLine(lyrics.timed, currentTime, LYRIC_LEAD_SECONDS),
    [lyrics.timed, currentTime],
  );

  const activeLine = activeIndex >= 0 ? lyrics.timed[activeIndex] : undefined;
  const secondaryRevealed = Boolean(activeLine?.secondary && currentTime >= activeLine.secondary.time);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Drive the element from the requested playback state. `currentSong` is a
  // dependency so a track change starts playing without any timeout juggling.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (!isPlaying) {
      audio.pause();
      return;
    }
    audio.play().catch((error: DOMException) => {
      // AbortError just means a newer load replaced this one.
      if (error.name !== 'AbortError') setPlaying(false);
    });
  }, [isPlaying, currentSong, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // The browser reports the new resource before any of its metadata, so this is
  // where the previous track's clock gets cleared.
  const handleLoadStart = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio) setCurrentTime(audio.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) setDuration(audio.duration);
  }, []);

  const handleEnded = useCallback(() => {
    // With `loop` on the element the event never fires, so this is only the
    // "move on" path.
    if (queue.length > 1) next();
    else setPlaying(false);
  }, [queue.length, next, setPlaying]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const seekToProgress = useCallback(
    (percent: number) => {
      if (duration > 0) seekTo((percent / 100) * duration);
    },
    [duration, seekTo],
  );

  const changeVolume = useCallback((percent: number) => {
    const value = Math.min(1, Math.max(0, percent / 100));
    setVolume(value);
    setMuted(value === 0);
    if (value > 0) lastAudibleVolume.current = value;
  }, []);

  // Media Session actions address play/pause explicitly rather than toggling.
  const mediaPlay = useCallback(() => setPlaying(true), [setPlaying]);
  const mediaPause = useCallback(() => setPlaying(false), [setPlaying]);

  useMediaSession({
    song: currentSong,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    onPlay: mediaPlay,
    onPause: mediaPause,
    onNext: next,
    onPrevious: previous,
    onSeek: seekTo,
  });

  const toggleMute = useCallback(() => {
    if (muted || volume === 0) {
      setVolume(lastAudibleVolume.current || 0.5);
      setMuted(false);
      return;
    }
    lastAudibleVolume.current = volume;
    setMuted(true);
  }, [muted, volume]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOverlayOpen(false);
        return;
      }
      if (event.key !== ' ' && event.code !== 'Space') return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      togglePlay();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (!currentSong) return null;

  const viewProps: PlayerViewProps = {
    song: currentSong,
    isPlaying,
    isShuffle,
    isLoop,
    isLyricsOpen: lyricsOpen,
    hasLyrics,
    progress,
    currentTime,
    duration,
    volume,
    muted,
    lyrics,
    activeIndex,
    secondaryRevealed,
    onTogglePlay: togglePlay,
    onNext: next,
    onPrevious: previous,
    onToggleShuffle: toggleShuffle,
    onToggleLoop: () => setIsLoop((previous) => !previous),
    onSeek: seekTo,
    onSeekProgress: seekToProgress,
    onVolumeChange: changeVolume,
    onToggleMute: toggleMute,
    onToggleLyrics: () => setIsLyricsOpen(!lyricsOpen),
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.src}
        preload="metadata"
        loop={isLoop}
        onLoadStart={handleLoadStart}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <PlayerBar {...viewProps} onOpen={() => setIsOverlayOpen(true)} />
      <MobilePlayerSheet {...viewProps} open={isOverlayOpen && !isDesktop} onClose={() => setIsOverlayOpen(false)} />
      <DesktopPlayerModal {...viewProps} open={isOverlayOpen && isDesktop} onClose={() => setIsOverlayOpen(false)} />
    </>
  );
}
