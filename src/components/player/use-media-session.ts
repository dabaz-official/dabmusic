"use client";

import { useEffect, type RefObject } from "react";

import type { Song } from "@/lib/types";

interface MediaSessionOptions {
  song: Song | null;
  /** Album title shown as the third metadata line. */
  albumTitle: string | null;
  /** Resolved song metadata (the Song fields are optional overrides). */
  artist: string | null;
  cover: string | null;
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
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/** The OS fetches artwork itself, so it needs an absolute URL. */
function coverArtwork(cover: string): MediaImage[] {
  const extension = cover.split(".").pop()?.toLowerCase() ?? "";
  return [
    {
      src: new URL(cover, window.location.origin).href,
      type: MIME_BY_EXTENSION[extension] ?? "image/jpeg",
    },
  ];
}

/**
 * Mirrors playback into the OS media UI: lock screens, the notification
 * shade, Control Center and headset buttons read the metadata and drive the
 * same `<audio>` element through the action handlers. Everything here is
 * best-effort — an unsupported API is skipped, never thrown.
 */
export function useMediaSession({
  song,
  albumTitle,
  artist,
  cover,
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
  const supported =
    typeof navigator !== "undefined" && "mediaSession" in navigator;
  const hasMetadata = typeof MediaMetadata !== "undefined";

  // Title / artist / artwork.
  useEffect(() => {
    if (!supported || !hasMetadata || !song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: artist ?? "",
      album: albumTitle ?? "",
      artwork: cover ? coverArtwork(cover) : [],
    });
  }, [supported, hasMetadata, song, artist, albumTitle, cover]);

  // Play / pause state for the OS.
  useEffect(() => {
    if (!supported) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [supported, isPlaying]);

  // Keeps the system scrubber in sync with the element.
  useEffect(() => {
    if (!supported || !navigator.mediaSession.setPositionState) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: Math.min(currentTime, duration),
      });
    } catch {
      // A rejected position update never affects playback.
    }
  }, [supported, currentTime, duration, audioRef]);

  // Hardware / lock-screen controls.
  useEffect(() => {
    if (!supported) return;
    const session = navigator.mediaSession;

    session.setActionHandler("play", onPlay);
    session.setActionHandler("pause", onPause);
    session.setActionHandler("nexttrack", onNext);
    session.setActionHandler("previoustrack", onPrevious);
    session.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) onSeek(details.seekTime);
    });
    session.setActionHandler("seekbackward", (details) => {
      onSeek(Math.max(0, (audioRef.current?.currentTime ?? 0) - (details.seekOffset ?? 10)));
    });
    session.setActionHandler("seekforward", (details) => {
      const offset = details.seekOffset ?? 10;
      const audio = audioRef.current;
      onSeek(Math.min(audio?.duration ?? 0, (audio?.currentTime ?? 0) + offset));
    });

    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("nexttrack", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("seekto", null);
      session.setActionHandler("seekbackward", null);
      session.setActionHandler("seekforward", null);
    };
  }, [supported, onPlay, onPause, onNext, onPrevious, onSeek, audioRef]);
}
