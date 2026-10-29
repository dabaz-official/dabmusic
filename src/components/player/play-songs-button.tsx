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
        // Apple's album-header pill: 130×36, fully rounded, 15px semibold
        // label with a 15px glyph. Fixed width so "Play" and "Pause" never
        // resize it.
        className="flex h-9 w-[130px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
      >
        <PlayPauseIcon playing={thisIsPlaying} className="h-[15px] w-auto" />
        {thisIsPlaying ? "Pause" : "Play"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={thisIsPlaying ? "Pause" : "Play"}
      // Apple's artwork-overlay button, measured on their album cards: a 40%
      // gray-800 circle over a 60px blur with a white glyph and no border. It
      // reads as dark glass on top of any cover, which is why it does not
      // follow the page theme.
      className={`absolute bottom-2 right-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-(--dz-cover-play-bg) text-white backdrop-blur-[60px] backdrop-saturate-[1.6] transition-opacity focus-visible:opacity-100 group-hover:opacity-100 ${
        touch ? "opacity-100" : "opacity-0"
      }`}
    >
      <PlayPauseIcon playing={thisIsPlaying} className="h-3.5 w-auto" />
    </button>
  );
}
