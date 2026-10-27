"use client";

import type { Album, Song } from "@/lib/types";
import { useTouchDevice } from "@/lib/use-touch-device";

import { PlayPauseIcon } from "./player-icons";
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
  // Touch devices have no hover, so the cover button must be always visible
  // there or it could never be pressed.
  const touch = useTouchDevice();

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
        // Fixed width: "Play" (82px) and "Pause" (95px) must not resize the
        // button, so it is sized for the longer label and centred.
        className="flex h-10 w-24 items-center justify-center gap-2 rounded-md bg-primary text-sm font-normal text-on-primary"
      >
        <PlayPauseIcon playing={thisIsPlaying} className="h-4 w-auto" />
        {thisIsPlaying ? "Pause" : "Play"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={thisIsPlaying ? "Pause" : "Play"}
      // Same material as the mini bar: translucent surface over a heavy
      // blur, with the shared hairline edge.
      className={`absolute bottom-2 right-2 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-(--dz-hairline) bg-surface/50 text-text-primary backdrop-blur-[48px] backdrop-saturate-[1.8] transition-opacity focus-visible:opacity-100 group-hover:opacity-100 ${
        touch ? "opacity-100" : "opacity-0"
      }`}
    >
      <PlayPauseIcon playing={thisIsPlaying} className="h-3.5 w-auto" />
    </button>
  );
}
