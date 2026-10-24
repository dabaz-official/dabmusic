"use client";

import { useEffect, type RefObject } from "react";

import type { Song } from "@/lib/types";

interface MediaSessionOptions {
  song: Song | null;
  isPlaying: boolean;
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
 * Mirrors playback into the OS media UI. Lock screens, notification shades,
 * Control Center and headset buttons all read title, artist and cover from
 * here.
 */
export function useMediaSession({
  song,
  isPlaying,
  duration,
  audioRef,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
}: MediaSessionOptions) {
  useEffect(() => {
    if (!("mediaSession" in navigator) || !song) return;
    if (typeof MediaMetadata === "undefined") return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title,
      artist: song.artist ?? "",
      album: song.albumId,
      artwork: coverArtwork(song.cover ?? ""),
    });
  }, [song]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Keeps the system scrubber in sync with the audio element.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) {
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate ?? 1,
        position: audioRef.current?.currentTime ?? 0,
      });
    } catch {
      // Position state is a courtesy; a rejected update never breaks playback.
    }
  }, [duration, audioRef]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;

    session.setActionHandler("play", onPlay);
    session.setActionHandler("pause", onPause);
    session.setActionHandler("nexttrack", onNext);
    session.setActionHandler("previoustrack", onPrevious);
    session.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) onSeek(details.seekTime);
    });

    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("nexttrack", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("seekto", null);
    };
  }, [onPlay, onPause, onNext, onPrevious, onSeek]);
}
