"use client";

import type { Album, Song } from "@/lib/types";

import { IconPause, IconPlay } from "./player-icons";
import { usePlayer } from "./player-provider";

interface PlaySongsButtonProps {
  songs: Song[];
  album: Album;
  /** "square" overlays grid covers, "pill" sits in album headers. */
  variant?: "square" | "pill";
}

/**
 * Starts the album as a queue from its first track (or the given song).
 * Shows a pause state while any of these songs is the playing track.
 */
export function PlaySongsButton({
  songs,
  album,
  variant = "square",
}: PlaySongsButtonProps) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  const first = songs[0];
  if (!first) return null;

  const inThisQueue =
    currentSong !== null && songs.some((song) => song.id === currentSong.id);
  const thisIsPlaying = inThisQueue && isPlaying;

  const handleClick = () => {
    if (inThisQueue) togglePlay();
    else play(first, album);
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-normal text-on-primary"
      >
        {thisIsPlaying ? (
          <IconPause className="h-4 w-auto" />
        ) : (
          <IconPlay className="h-4 w-auto" />
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
        <IconPause className="h-[18px] w-auto" />
      ) : (
        <IconPlay className="h-[18px] w-auto" />
      )}
    </button>
  );
}
