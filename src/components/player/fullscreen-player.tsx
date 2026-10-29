"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";

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
  "flex h-9 w-9 items-center justify-center rounded-md transition-colors";

/**
 * Full-screen player, laid out after music.apple.com's: artwork and transport
 * in a centred column, with a heavily blurred
 * copy of the cover as the backdrop. Entrance and exit are motion-driven;
 * `prefers-reduced-motion` collapses them to plain fades. The `dark` class
 * pins the subtree to the dark palette — Apple's full-screen view keeps its
 * dark colours in light mode.
 */
export function FullscreenPlayer() {
  const {
    currentSong,
    currentAlbum,
    isPlaying,
    togglePlay,
    setPlaying,
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
  /** Whether playback was running when the current scrub began. */
  const resumeAfterScrub = useRef(false);
  /** Last audible level, so unmuting returns to it rather than guessing. */
  const lastAudibleVolume = useRef(1);

  useEffect(() => {
    if (volume > 0) lastAudibleVolume.current = volume;
  }, [volume]);

  const toggleMute = () => {
    if (volume > 0) {
      // Capture the exact level being silenced, so unmuting returns to it.
      lastAudibleVolume.current = volume;
      changeVolume(0);
      return;
    }
    changeVolume(lastAudibleVolume.current);
  };

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
      className="dark fixed inset-0 z-50 overflow-hidden bg-background"
      initial={fade.initial}
      animate={fade.animate}
      exit={fade.exit}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : { type: "spring", stiffness: 260, damping: 30 }
      }
    >
      {/* Backdrop: the cover itself, blown up and blurred, then dimmed. The
          clip matters — `scale-125` would otherwise register as scrollable
          overflow on the dialog, which the browser scrolls to reveal a focused
          control, shifting the whole layer. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
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
          className="absolute left-5 top-4 flex h-[18px] w-[18px] cursor-pointer items-center justify-center text-text-primary/70"
        >
          {/* Apple's own close glyph: a full-bleed 18×18 path (lucide's X
              leaves too much canvas padding and reads visibly smaller). */}
          <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M1.2 18C.6 18 0 17.5 0 16.8c0-.4.1-.6.4-.8l7-7-7-7c-.3-.2-.4-.5-.4-.8C0 .5.6 0 1.2 0c.3 0 .6.1.8.3l7 7 7-7c.2-.2.5-.3.8-.3.6 0 1.2.5 1.2 1.2 0 .3-.1.6-.4.8l-7 7 7 7c.2.2.4.5.4.8 0 .7-.6 1.2-1.2 1.2-.3 0-.6-.1-.8-.3l-7-7-7 7c-.2.1-.5.3-.8.3"
            />
          </svg>
        </button>

        {/* ≥1000px: the column (cover → info → controls) is centred in the
            viewport as a whole, so the air above the artwork equals the air
            below the volume track. */}
        <div className="relative flex min-h-0 flex-1 pb-8 pt-14 full:flex-none full:py-0">
          <div className="flex min-h-0 flex-1 justify-center">
            <motion.div
              className="flex min-h-0 w-[var(--dz-fs-col)] max-w-full shrink-0 flex-col items-center justify-center gap-6"
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
              sizes="(min-width: 1000px) 600px, 80vw"
              className="aspect-square w-full self-center rounded-lg object-cover shadow-2xl"
            />

            <div className="w-full self-center">
              {/* Colours measured from music.apple.com's full-screen player
                  (dark context): title white 92%, artist 64%, times 55% at
                  11px/500, shuffle/repeat at rest 64%, prev/next 80%,
                  play/pause full white. */}
              {/* Type from music.apple.com's full-screen player: title and
                  artist line both 17px/700 with a 22px line box; the artist
                  line is the 64% white. */}
              <h1 className="flex items-center justify-center gap-[3px] truncate text-center text-[17px] font-bold leading-[22px] text-[#ffffffeb]">
                <span className="truncate">{currentSong.title}</span>
                {currentSong.explicit && (
                  /* Nudged 1px up: the flex box centres on the 22px line box,
                     but the perceived centre is the cap height, which sits a
                     hair higher. */
                  <ExplicitBadge className="h-[17px] w-[17px] shrink-0 -translate-y-px" />
                )}
              </h1>
              <p className="mt-0.5 truncate text-center text-[17px] font-bold leading-[22px] text-[#ffffffa3]">
                {artist}
                {" — "}
                <Link
                  href={`/album/${currentAlbum.id}`}
                  onClick={() => setExpanded(false)}
                  className="cursor-pointer hover:underline"
                >
                  {currentAlbum.title}
                </Link>
              </p>

              <div className="mt-5">
                <WaveformSeek
                  url={currentSong.waveform}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={seek}
                  // Silence playback for the length of a drag, then pick up
                  // again from wherever it was released.
                  onScrubStart={() => {
                    resumeAfterScrub.current = isPlaying;
                    if (isPlaying) setPlaying(false);
                  }}
                  onScrubEnd={() => {
                    if (resumeAfterScrub.current) setPlaying(true);
                    resumeAfterScrub.current = false;
                  }}
                  className="w-full"
                  height={28}
                />
                <div className="mt-1 flex items-center justify-between text-[11px] font-medium tabular-nums text-[#ffffff8c]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{`-${formatTime(Math.max(duration - currentTime, 0))}`}</span>
                </div>
              </div>

              {/* Optical balance: the play glyph sits the same distance from
                  the waveform's bottom edge as from the volume track. The
                  time row lives above the transport, so this needs the
                  transport pulled up (mt-1) and the volume pushed down
                  (mt-6) — both visible gaps land at ~33px. */}
              <div className="mt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className={`${controlButton} cursor-pointer ${
                    shuffle ? "text-white hover:text-[#ffffffcc]" : "text-[#ffffffa3] hover:text-[#ffffffeb]"
                  }`}
                  aria-label="Shuffle"
                  aria-pressed={shuffle}
                  onClick={toggleShuffle}
                >
                  <IconShuffle className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${controlButton} cursor-pointer text-[#ffffffcc] hover:text-white`}
                  aria-label="Previous track"
                  onClick={previous}
                >
                  <IconPrevious className="h-5 w-auto" />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-white"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  onClick={togglePlay}
                >
                  <PlayPauseIcon playing={isPlaying} className="h-7 w-auto" />
                </button>
                <button
                  type="button"
                  className={`${controlButton} cursor-pointer text-[#ffffffcc] hover:text-white`}
                  aria-label="Next track"
                  onClick={next}
                >
                  <IconNext className="h-5 w-auto" />
                </button>
                <button
                  type="button"
                  className={`${controlButton} cursor-pointer ${
                    repeat !== "off" ? "text-white hover:text-[#ffffffcc]" : "text-[#ffffffa3] hover:text-[#ffffffeb]"
                  }`}
                  aria-label={`Repeat: ${repeat}`}
                  aria-pressed={repeat !== "off"}
                  onClick={cycleRepeat}
                >
                  <RepeatIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Measured to the volume track's visible 4px bar (not the
                  12px input box): mt-[19.5px] puts it 32.5px below the play
                  glyph, matching the 32.5px from the glyph up to the
                  waveform. */}
              {/* At ≥1000px the column is centred in the viewport and the lyric
                  band is bookended to it, so the row must end on the volume
                  track itself: the input is 12px with a 4px track centred in
                  it (4px of air below), plus 1px of the row — hence -mb-[5px].
                  Without it the block sits 2.5px high and the lyrics overshoot
                  the track by 5px. */}
              <div className="mt-[19.5px] flex items-center gap-2 full:-mb-[5px]">
                {/* Mute toggle: silences the player, and a second press comes
                    back to whatever level was audible before. */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  aria-pressed={volume === 0}
                  className="flex shrink-0 cursor-pointer items-center text-[#ffffffeb] transition-colors hover:text-white"
                >
                  <IconVolume volume={volume} className="h-3.5 w-auto" />
                </button>
                {/* Apple's volume slider: white fill over a 40% white track. */}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  aria-label="Volume"
                  style={{ "--vol": `${volume * 100}%` } as React.CSSProperties}
                  className="h-3 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,#fff_var(--vol),#fff6_var(--vol))] [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
