"use client";

import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect } from "react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";

import { LyricsView } from "./lyrics-view";
import {
  IconNext,
  IconPrevious,
  IconRepeat,
  IconRepeatOne,
  IconShuffle,
  IconVolume,
  PlayPauseIcon,
} from "./player-icons";
import { usePlayer } from "./player-provider";
import { WaveformSeek } from "./wave-form-seek";

const controlButton =
  "flex h-9 w-9 items-center justify-center rounded-md text-text-primary/70 transition-colors hover:text-text-primary";

/**
 * Full-screen player, laid out after music.apple.com's: artwork and transport
 * in the left column, lyrics filling the right one, with a heavily blurred
 * copy of the cover as the backdrop. Entrance and exit are motion-driven;
 * `prefers-reduced-motion` collapses them to plain fades.
 */
export function FullscreenPlayer() {
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
    volume,
    changeVolume,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    setExpanded,
  } = usePlayer();

  const reducedMotion = useReducedMotion();

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [setExpanded]);

  if (!currentSong || !currentAlbum) return null;

  const cover = currentSong.cover ?? currentAlbum.cover;
  const artist = currentSong.artist ?? currentAlbum.artist;
  const RepeatIcon = repeat === "one" ? IconRepeatOne : IconRepeat;

  const fade = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 1.02 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.02 },
      };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      className="fixed inset-0 z-50 overflow-hidden bg-background"
      initial={fade.initial}
      animate={fade.animate}
      exit={fade.exit}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 260, damping: 30 }
      }
    >
      {/* Backdrop: the cover itself, blown up and blurred, then dimmed. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          src={cover}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-125 object-cover blur-[80px] saturate-150"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="flex h-full flex-col px-6 pt-5 sm:px-8">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Close"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-md text-text-primary/70 transition-colors hover:text-text-primary"
        >
          <X size={24} aria-hidden="true" />
        </button>

        <div className="grid min-h-0 flex-1 gap-10 pb-8 lg:grid-cols-[minmax(300px,430px)_1fr] lg:gap-16 lg:pt-4">
          <motion.div
            className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-6 lg:items-stretch lg:justify-start"
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.35, ease: "easeOut" }}
          >
            <Image
              src={cover}
              alt={`${currentAlbum.title} cover`}
              width={860}
              height={860}
              priority
              sizes="(min-width: 1024px) 430px, 80vw"
              className="aspect-square w-full max-w-[min(430px,46vh,100%)] self-center rounded-lg object-cover shadow-2xl"
            />

            <div className="w-full max-w-[430px] self-center lg:max-w-none">
              <h1 className="flex items-baseline gap-2 truncate text-[17px] font-semibold text-text-primary">
                <span className="truncate">{currentSong.title}</span>
                {currentSong.explicit && (
                  <ExplicitBadge className="h-[10px] w-[10px] shrink-0" />
                )}
              </h1>
              <p className="mt-0.5 truncate text-[13px] text-text-primary/60">
                {artist}
                {" — "}
                {currentAlbum.title}
              </p>

              <div className="mt-5 flex items-center gap-3">
                <span className="w-10 text-xs tabular-nums text-text-primary/60">
                  {formatTime(currentTime)}
                </span>
                <WaveformSeek
                  url={currentSong.waveform}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={seek}
                  className="min-w-0 flex-1"
                  height={28}
                />
                <span className="w-10 text-right text-xs tabular-nums text-text-primary/60">
                  {`-${formatTime(Math.max(duration - currentTime, 0))}`}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className={`${controlButton} ${shuffle ? "text-text-primary" : ""}`}
                  aria-label="Shuffle"
                  aria-pressed={shuffle}
                  onClick={toggleShuffle}
                >
                  <IconShuffle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={controlButton}
                  aria-label="Previous track"
                  onClick={previous}
                >
                  <IconPrevious className="h-5 w-auto" />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-md text-text-primary"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                >
                  <PlayPauseIcon playing={isPlaying} className="h-7 w-auto" />
                </button>
                <button
                  type="button"
                  className={controlButton}
                  aria-label="Next track"
                  onClick={next}
                >
                  <IconNext className="h-5 w-auto" />
                </button>
                <button
                  type="button"
                  className={`${controlButton} ${
                    repeat !== "off" ? "text-text-primary" : ""
                  }`}
                  aria-label={`Repeat: ${repeat}`}
                  aria-pressed={repeat !== "off"}
                  onClick={cycleRepeat}
                >
                  <RepeatIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <IconVolume volume={volume} className="h-3.5 w-auto shrink-0 text-text-primary/60" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  aria-label="Volume"
                  className="h-1 w-full accent-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Lyrics column — hidden on small screens where the artwork wins. */}
          <motion.div
            className="hidden min-h-0 lg:block"
            initial={reducedMotion ? undefined : { opacity: 0 }}
            animate={reducedMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            <LyricsView url={currentSong.lyrics} currentTime={currentTime} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
