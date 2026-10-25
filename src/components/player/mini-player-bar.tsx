"use client";

import Image from "next/image";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";

import {
  IconNext,
  IconPause,
  IconPlay,
  IconPrevious,
} from "./player-icons";
import { usePlayer } from "./player-provider";
import { WaveformSeek } from "./wave-form-seek";

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
        <Image
          src={cover}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
        {/* Fixed-width info: sized so the longest title (LOVE GOT ME NUMB)
            fits complete; longer titles truncate inside it. */}
        <div className="w-40 shrink-0">
          <div className="flex items-baseline gap-1.5">
            <span className="min-w-0 truncate text-sm font-normal text-text-primary">
              {currentSong.title}
            </span>
            {/* 11px = the rendered cap height of the 14px title. */}
            {currentSong.explicit && (
              <ExplicitBadge className="h-[11px] w-[11px]" />
            )}
          </div>
          <div className="truncate text-xs text-text-tertiary">{artist}</div>
        </div>

          {/* Waveform sits right of the track info, transport right of it. */}
          <div className="ml-2 hidden min-w-0 flex-[2] items-center gap-3 md:flex">
            <span className="w-10 text-right text-xs tabular-nums text-text-tertiary">
              {formatTime(currentTime)}
            </span>
            <WaveformSeek
              url={currentSong.waveform}
              currentTime={currentTime}
              duration={duration}
              onSeek={seek}
              className="min-w-0 flex-1"
            />
            <span className="w-10 text-xs tabular-nums text-text-tertiary">
              {formatTime(duration)}
            </span>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              className="flex h-8 items-center justify-center rounded-md px-1 text-text-secondary"
              aria-label="Previous track"
              onClick={previous}
            >
              <IconPrevious className="h-4 w-auto shrink-0" />
            </button>
            {/* Play/pause share the same 22×24 slot, no circular background —
                swapping never moves the glyph. */}
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center text-text-primary"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <IconPause className="h-6 w-auto" />
              ) : (
                <IconPlay className="h-6 w-auto" />
              )}
            </button>
            <button
              type="button"
              className="flex h-8 items-center justify-center rounded-md px-1 text-text-secondary"
              aria-label="Next track"
              onClick={next}
            >
              <IconNext className="h-4 w-auto shrink-0" />
            </button>
          </div>
      </div>
    </footer>
  );
}
