"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import Image from "next/image";

import { formatTime } from "@/lib/format";

import { usePlayer } from "./player-provider";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-text-secondary";

/**
 * The persistent transport — deliberately plain; the owner will restyle it.
 * Spans the content column: full width below sm, offset by the sidebar from
 * sm up.
 */
export function MiniPlayerBar() {
  const {
    currentSong,
    currentAlbum,
    isPlaying,
    togglePlay,
    next,
    previous,
    currentTime,
    duration,
    seek,
  } = usePlayer();

  if (!currentSong || !currentAlbum) return null;

  const cover = currentSong.cover ?? currentAlbum.cover;
  const artist = currentSong.artist ?? currentAlbum.artist;

  return (
    <footer className="fixed inset-x-0 bottom-0 left-0 z-40 border-t border-border bg-surface sm:left-(--dz-sidebar-width)">
      <div className="flex h-20 items-center gap-4 px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Image
            src={cover}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-normal text-text-primary">
              {currentSong.title}
            </div>
            <div className="truncate text-xs text-text-tertiary">{artist}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconButton}
            aria-label="Previous track"
            onClick={previous}
          >
            <SkipBack size={18} aria-hidden="true" fill="currentColor" />
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause size={18} aria-hidden="true" fill="currentColor" />
            ) : (
              <Play
                size={18}
                aria-hidden="true"
                fill="currentColor"
                className="ml-0.5"
              />
            )}
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label="Next track"
            onClick={next}
          >
            <SkipForward size={18} aria-hidden="true" fill="currentColor" />
          </button>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <span className="w-10 text-right text-xs tabular-nums text-text-tertiary">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek"
            className="h-1 w-full accent-focus"
          />
          <span className="w-10 text-xs tabular-nums text-text-tertiary">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </footer>
  );
}
