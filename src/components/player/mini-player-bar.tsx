"use client";

import {
  ChevronUp,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import Image from "next/image";

import { formatTime } from "@/lib/format";

import { usePlayer } from "./player-provider";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary aria-pressed:text-text-primary";

/**
 * The persistent transport. Deliberately plain — phase 4 ships function; the
 * final visual pass comes with the full-screen player. `left-80` matches the
 * locked 320px sidebar so the bar spans the content column only.
 */
export function MiniPlayerBar() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    next,
    previous,
    currentTime,
    duration,
    seek,
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    setExpanded,
  } = usePlayer();

  if (!currentSong) return null;

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <footer className="fixed inset-x-0 bottom-0 left-80 z-40 border-t border-border bg-surface">
      <div className="flex h-20 items-center gap-4 px-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Open full-screen player"
        >
          <Image
            src={currentSong.cover ?? ""}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-primary">
              {currentSong.title}
            </div>
            <div className="truncate text-xs text-text-tertiary">
              {currentSong.artist}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconButton}
            aria-label="Shuffle"
            aria-pressed={shuffle}
            onClick={toggleShuffle}
          >
            <Shuffle size={16} aria-hidden="true" />
          </button>
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
              <Play size={18} aria-hidden="true" fill="currentColor" className="ml-0.5" />
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
          <button
            type="button"
            className={iconButton}
            aria-label={`Repeat: ${repeat}`}
            aria-pressed={repeat !== "off"}
            onClick={cycleRepeat}
          >
            <RepeatIcon size={16} aria-hidden="true" />
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

        <button
          type="button"
          className={iconButton}
          aria-label="Open full-screen player"
          onClick={() => setExpanded(true)}
        >
          <ChevronUp size={18} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
