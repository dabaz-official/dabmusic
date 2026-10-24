"use client";

import { Pause, Play } from "lucide-react";

import type { Song } from "@/lib/types";

import { usePlayer } from "./player-provider";

interface PlaySongsButtonProps {
  songs: Song[];
  /** "square" for grid covers, "pill" for album headers. */
  variant?: "square" | "pill";
}

/**
 * Starts the given songs as a queue (track 1 by default). Shows a pause
 * state while any of them is the playing track.
 */
export function PlaySongsButton({ songs, variant = "square" }: PlaySongsButtonProps) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  const first = songs[0];
  if (!first) return null;

  const thisIsPlaying =
    isPlaying && songs.some((song) => song.id === currentSong?.id);

  const handleClick = () => {
    if (currentSong && songs.some((song) => song.id === currentSong.id)) {
      togglePlay();
    } else {
      play(first, songs);
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-on-primary"
      >
        {thisIsPlaying ? (
          <Pause size={16} aria-hidden="true" fill="currentColor" />
        ) : (
          <Play size={16} aria-hidden="true" fill="currentColor" />
        )}
        {thisIsPlaying ? "Pause" : "Play"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={thisIsPlaying ? "Pause" : "Play"}
      className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary opacity-0 shadow-lg transition-opacity focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {thisIsPlaying ? (
        <Pause size={18} aria-hidden="true" fill="currentColor" />
      ) : (
        <Play size={18} aria-hidden="true" fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
}
