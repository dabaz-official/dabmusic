"use client";

import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";

import { formatTime } from "@/lib/format";

import { LyricsView } from "./lyrics-view";
import { usePlayer } from "./player-provider";

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary aria-pressed:text-text-primary";

/** Cover and lyrics side by side on desktop, stacked on small screens. */
export function FullscreenPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlay,
    next,
    previous,
    currentTime,
    duration,
    seek,
    volume,
    muted,
    changeVolume,
    toggleMute,
    repeat,
    cycleRepeat,
    shuffle,
    toggleShuffle,
    setExpanded,
  } = usePlayer();

  if (!currentSong) return null;

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div
      className="fixed inset-0 z-50 bg-background"
      role="dialog"
      aria-label="Full-screen player"
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end p-6">
          <button
            type="button"
            className={iconButton}
            aria-label="Close full-screen player"
            onClick={() => setExpanded(false)}
          >
            <ChevronDown size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-8 px-10 pb-10 lg:grid-cols-2 lg:gap-14 lg:px-16">
          <div className="flex min-h-0 flex-col items-center justify-center gap-8">
            <Image
              src={currentSong.cover ?? ""}
              alt=""
              width={440}
              height={440}
              className="max-h-[min(440px,45vh)] w-auto max-w-full rounded-xl object-cover shadow-2xl"
              priority
            />
            <div className="w-full max-w-md text-center lg:text-left">
              <h1 className="truncate text-2xl font-semibold text-text-primary">
                {currentSong.title}
              </h1>
              <p className="mt-1 truncate text-base text-text-secondary">
                {currentSong.artist}
              </p>
            </div>

            <div className="w-full max-w-md space-y-3">
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
              <div className="flex justify-between text-xs tabular-nums text-text-tertiary">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between">
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
                    aria-label={`Repeat: ${repeat}`}
                    aria-pressed={repeat !== "off"}
                    onClick={cycleRepeat}
                  >
                    <RepeatIcon size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={iconButton}
                    aria-label="Previous track"
                    onClick={previous}
                  >
                    <SkipBack size={22} aria-hidden="true" fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary"
                    aria-label={isPlaying ? "Pause" : "Play"}
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause size={24} aria-hidden="true" fill="currentColor" />
                    ) : (
                      <Play size={24} aria-hidden="true" fill="currentColor" className="ml-1" />
                    )}
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    aria-label="Next track"
                    onClick={next}
                  >
                    <SkipForward size={22} aria-hidden="true" fill="currentColor" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={iconButton}
                    aria-label={muted ? "Unmute" : "Mute"}
                    onClick={toggleMute}
                  >
                    {muted || volume === 0 ? (
                      <VolumeX size={16} aria-hidden="true" />
                    ) : (
                      <Volume2 size={16} aria-hidden="true" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(event) => changeVolume(Number(event.target.value))}
                    aria-label="Volume"
                    className="h-1 w-24 accent-focus"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-hidden">
            <LyricsView url={currentSong.lyrics} currentTime={currentTime} />
          </div>
        </div>
      </div>
    </div>
  );
}
