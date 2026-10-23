'use client';

import { useEffect, type RefObject } from 'react';

import type { Song } from '@/lib/albums';

interface MediaSessionOptions {
  song: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

/** The OS fetches artwork itself, so it needs an absolute URL. */
function coverArtwork(cover: string): MediaImage[] {
  const extension = cover.split('.').pop()?.toLowerCase() ?? '';
  return [
    {
      src: new URL(cover, window.location.origin).href,
      type: MIME_BY_EXTENSION[extension] ?? 'image/jpeg',
    },
  ];
}

/**
 * Mirrors playback into the OS media UI. Lock screens, notification shades,
 * Control Center and headset buttons all read title, artist and cover from here.
 */
export function useMediaSession({
  song,
  isPlaying,
  currentTime,
  duration,
  audioRef,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
}: MediaSessionOptions) {
  useEffect(() => {
    if (!('mediaSession' in navigator) || !song) return;
    if (typeof MediaMetadata === 'undefined') return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist,
      artwork: coverArtwork(song.cover),
    });
  }, [song]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Keeps the system scrubber in sync with the audio element.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: Math.min(Math.max(currentTime, 0), duration),
      });
    } catch {
      // Some browsers reject transient values while a new track is loading.
    }
  }, [audioRef, currentTime, duration]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => onPlay()],
      ['pause', () => onPause()],
      ['stop', () => {
        onPause();
        onSeek(0);
      }],
      ['previoustrack', () => onPrevious()],
      ['nexttrack', () => onNext()],
      ['seekto', (details) => {
        if (typeof details.seekTime === 'number') onSeek(details.seekTime);
      }],
      ['seekbackward', (details) => {
        const position = audioRef.current?.currentTime ?? 0;
        onSeek(Math.max(0, position - (details.seekOffset ?? 10)));
      }],
      ['seekforward', (details) => {
        const position = audioRef.current?.currentTime ?? 0;
        onSeek(position + (details.seekOffset ?? 10));
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Unsupported actions are expected on older browsers.
      }
    }

    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // Ignore actions the browser never accepted.
        }
      }
    };
  }, [audioRef, onNext, onPause, onPlay, onPrevious, onSeek]);
}
