"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";

import { LyricsView } from "./lyrics-view";
import {
  IconLyrics,
  IconLyricsActive,
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
    toggleMute,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    setExpanded,
  } = usePlayer();

  const reducedMotion = useReducedMotion();
  const [lyricsOpen, setLyricsOpen] = useState(false);
  /** Whether playback was running when the current scrub began. */
  const resumeAfterScrub = useRef(false);
  /** Artwork height, so the sung lyric can sit on the artwork's centre line. */
  const coverObserverRef = useRef<ResizeObserver | null>(null);
  const [coverHeight, setCoverHeight] = useState(0);

  // Callback ref, not an effect: the player is mounted before a song exists, so
  // an effect with empty deps would run while the artwork was still null.
  const measureCover = useCallback((node: HTMLDivElement | null) => {
    coverObserverRef.current?.disconnect();
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setCoverHeight(entries[0].contentRect.height);
    });
    observer.observe(node);
    coverObserverRef.current = observer;
  }, []);

  useEffect(() => () => coverObserverRef.current?.disconnect(), []);

  // Below 1000px Apple's player is a sliding modal: collapsing from the top bar
  // sends the whole sheet down out of view rather than fading it.
  const narrow = useMediaQuery("(max-width: 999px)");
  // Lyrics open *and* narrow: the compact in-stack lyrics view. From
  // 1000px up the lyrics get their own column instead and this stays false.
  const lyricsInStack = lyricsOpen && narrow;

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

  // Below 1000px the sheet slides back down out of view instead of fading.
  const exit = narrow && !reducedMotion ? { y: "100%" } : fade.exit;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      className="dark fixed inset-0 z-50 overflow-hidden bg-background"
      initial={fade.initial}
      animate={fade.animate}
      exit={exit}
      transition={
        reducedMotion
          ? { duration: 0.15 }
          : narrow
            ? { duration: 0.32, ease: [0.32, 0.72, 0, 1] }
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

      {/* Lyrics toggle. Below 1000px it sits centred at the bottom of the
          stack, 20px up rather than 23: its 22px glyph is centred in the 28px
          box, so the ink then sits exactly as far from the bottom edge as the
          collapse bar's chevron ink does from the top (both 23px). From 1000px
          up it goes where music.apple.com's does — box 20px from the right and
          23px from the bottom — 64% white until switched on. */}
      <button
        type="button"
        onClick={() => setLyricsOpen((open) => !open)}
        aria-label="Lyrics"
        aria-pressed={lyricsOpen}
        className="absolute bottom-5 left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 cursor-pointer items-center justify-center transition-colors full:bottom-[23px] full:left-auto full:right-5 full:translate-x-0"
      >
        {lyricsOpen ? (
          <IconLyricsActive className="h-[22px] w-[22px] text-white" />
        ) : (
          <IconLyrics className="h-[22px] w-[22px] text-[#ffffffa3] transition-colors hover:text-[#ffffffeb]" />
        )}
      </button>

      {/* The halves are viewport halves, so the horizontal gutter moves to the
          cells when the split is on (Apple's own lyric column starts exactly
          at the viewport's mid-line). */}
      <div className="flex h-full flex-col full:justify-center full:pt-0">
        {/* ≥1000px the close affordance is Apple's top-left X; below 1000px
            their player has no X at all and collapses from a full-width bar at
            the top whose centred chevron is the whole affordance. */}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Close"
          className="absolute left-5 top-4 hidden h-[18px] w-[18px] cursor-pointer items-center justify-center text-text-primary/70 full:flex"
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

        {/* Below 1000px: Apple's `sliding-modal-collapse` bar — the whole 51px
            top band is the target, with a 24×8 chevron centred 23px down.
            `z-10` is required: the content row starts 20px down and would
            otherwise paint over (and swallow) everything below that. */}
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Close"
          className="absolute inset-x-0 top-0 z-10 flex h-[51px] cursor-pointer items-start justify-center pt-[23px] text-[#ffffffeb] full:hidden"
        >
          <svg width={24} height={8} viewBox="0 0 90.64 30.831" aria-hidden="true">
            <path
              fill="currentColor"
              d="m4.486 14.456 32.352 13.938c3.156 1.387 5.552 2.437 8.48 2.437 2.932 0 5.357-1.05 8.484-2.437l32.353-13.938c2.612-1.192 4.485-3.514 4.485-6.42C90.64 3.184 87.085 0 83 0c-2.279 0-5.172 1.325-7.569 2.42L42.845 16.358h4.95L15.21 2.42C12.812 1.325 9.948 0 7.636 0 3.55 0 0 3.184 0 8.036c0 2.906 1.873 5.228 4.486 6.42"
            />
          </svg>
        </button>

        {/* ≥1000px: the column (cover → info → controls) is centred in the
            viewport as a whole, so the air above the artwork equals the air
            below the volume track — lyrics on or off.

            With lyrics on, the page is two columns from 1000px up: the column
            stays centred inside the left half and the lyrics take the right
            one, left-aligned from the mid-line (Apple's own geometry — their
            lyric text starts exactly at the viewport's half) and capped at
            38vw, the width their longest line wraps to. Both sides are
            proportional, so a narrower window narrows both columns rather than
            leaving the artwork at full size. The lyric band is absolutely
            bookended to the row, so its top and bottom line up with the
            artwork's top and the volume track's bottom. Below 1000px the
            lyrics get the whole page. */}
        <div className="relative flex min-h-0 flex-1 full:flex-none full:py-0">
          {/* Below 1000px the view is a vertical stack, bottom-anchored: the
              cover takes the space that is left, then the title, the progress
              bar, the transport, the volume bar, and the lyrics button sits in
              the band below it. Every element shares the page's own gutter —
              the distance the home page keeps from the sidebar — rather than a
              player-specific inset. */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col px-[var(--dz-gutter)] pb-[73.5px] pt-[51px] full:hidden">
            {lyricsInStack ? (
              <>
                {/* With lyrics up, the artwork and the track's identity
                    collapse into a compact row that caps them from above. The
                    progress bar, transport and volume bar below are untouched,
                    so the lyrics fill the band between this row and the
                    waveform — nothing above or below them moves. */}
                <div className="flex shrink-0 justify-start">
                  <div className="flex w-full max-w-full items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md shadow-lg">
                      <Image
                        src={cover}
                        alt={`${currentAlbum.title} cover`}
                        width={56}
                        height={56}
                        sizes="56px"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h1 className="flex items-center gap-[3px] text-[17px] font-bold leading-[22px] text-[#ffffffeb]">
                        <span className="truncate">{currentSong.title}</span>
                        {currentSong.explicit && (
                          <ExplicitBadge className="h-[17px] w-[17px] shrink-0" />
                        )}
                      </h1>
                      <p className="mt-0.5 truncate text-[17px] leading-[22px] text-[#ffffffa3]">
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
                    </div>
                  </div>
                </div>
                <div className="min-h-0 flex-1">
                  <LyricsView
                    url={currentSong.lyrics}
                    currentTime={currentTime}
                    onSeek={seek}
                    // 56px = 2 × the 28px gap the list keeps between lines
                    // (`space-y-7`), so the sung line hangs off the header by a
                    // measure drawn from the lyrics' own rhythm.
                    anchorTop={56}
                  />
                </div>
              </>
            ) : (
              <>
              {/* Largest square that still keeps the transport's own 39px of
                  air above and below: `min(region width, region height − 78px)`.
                  The region is a size container, so both figures exist in CSS
                  and no measurement pass is needed; centring then splits the
                  leftover equally, which is what makes the artwork's gap to the
                  title identical to the gap above it. */}
              <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center [container-type:size]">
                <div className="aspect-square w-[min(100cqw,calc(100cqh_-_78px))] shrink-0 overflow-hidden rounded-lg shadow-2xl">
                  <Image
                    src={cover}
                    alt={`${currentAlbum.title} cover`}
                    width={860}
                    height={860}
                    priority
                    sizes="(min-width: 1000px) 600px, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="text-center">
                <h1 className="flex items-center justify-center gap-[3px] text-[17px] font-bold leading-[22px] text-[#ffffffeb]">
                  <span className="truncate">{currentSong.title}</span>
                  {currentSong.explicit && (
                    /* No 1px nudge here: Apple's mobile header centres the badge
                       on the line box, and their own glyph is only a hair low. */
                    <ExplicitBadge className="h-[17px] w-[17px] shrink-0" />
                  )}
                </h1>
                <p className="mt-0.5 truncate text-[17px] leading-[22px] text-[#ffffffa3]">
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
              </div>
              </>
            )}

            <div className={lyricsInStack ? "mt-0" : "mt-[39px]"}>
              <WaveformSeek
                url={currentSong.waveform}
                currentTime={currentTime}
                duration={duration}
                onSeek={seek}
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

            {/* Apple's mobile transport keeps every glyph at full white (their
                wide-screen view is the one that dims prev/next to 80%), so
                shuffle and repeat take the same colour here. `justify-between`
                then pushes the first and last buttons out to the progress
                bar's own edges. Shuffle and repeat keep the pill's 2px dot as
                their only "on" cue, since colour no longer carries it. */}
            <div className="mt-[10.5px] flex items-center justify-between">
              <button
                type="button"
                className={`${controlButton} relative cursor-pointer text-white hover:text-[#ffffffcc]`}
                aria-label="Shuffle"
                aria-pressed={shuffle}
                onClick={toggleShuffle}
              >
                <IconShuffle className="h-4 w-4" />
                {shuffle && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                )}
              </button>
              <button
                type="button"
                className={`${controlButton} cursor-pointer text-white hover:text-[#ffffffcc]`}
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
                className={`${controlButton} cursor-pointer text-white hover:text-[#ffffffcc]`}
                aria-label="Next track"
                onClick={next}
              >
                <IconNext className="h-5 w-auto" />
              </button>
              <button
                type="button"
                className={`${controlButton} relative cursor-pointer text-white hover:text-[#ffffffcc]`}
                aria-label={`Repeat: ${repeat}`}
                aria-pressed={repeat !== "off"}
                onClick={cycleRepeat}
              >
                <RepeatIcon className="h-4 w-4" />
                {repeat !== "off" && (
                  <span className="absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                )}
              </button>
            </div>

            {/* The play glyph keeps the same 35px of air above (to the
                waveform's bottom edge) and below (to the volume track's top):
                the time row and the transport's own half-gap make up the top
                figure, so the margins are 9 above and 23 below rather than the
                symmetric 16/16 they would otherwise be. */}
            <div className="mt-[21.5px] w-full">
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

          <div
            className={`min-h-0 justify-center ${
              lyricsOpen ? "hidden w-1/2" : "flex-1"
            } hidden full:flex`}
          >
            <motion.div
              className={`flex min-h-0 shrink-0 flex-col items-center justify-center gap-6 ${
                lyricsOpen
                  ? "w-[62%] max-w-[600px]"
                  : "w-[var(--dz-fs-col)] max-w-full"
              }`}
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.35, ease: "easeOut" }}
          >
            {/* next/image does not forward the ref, so the artwork is measured
                through this wrapper (its height is the image's). */}
            <div ref={measureCover} className="w-full self-center">
              <Image
                src={cover}
                alt={`${currentAlbum.title} cover`}
                width={860}
                height={860}
                priority
                sizes="(min-width: 1000px) 600px, 80vw"
                className="aspect-square w-full rounded-lg object-cover shadow-2xl"
              />
            </div>

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

          {/* From 1000px up the lyrics keep their own column; below that the
              stack above owns them, so this one never mounts there. */}
          {lyricsOpen && !narrow && (
            <motion.div
              className="hidden min-h-0 flex-1 justify-start px-[var(--dz-gutter)] full:absolute full:inset-y-0 full:left-1/2 full:flex full:w-[min(38vw,700px)] full:px-0"
              initial={reducedMotion ? undefined : { opacity: 0 }}
              animate={reducedMotion ? undefined : { opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="min-h-0 w-full flex-1">
                <LyricsView
                  url={currentSong.lyrics}
                  currentTime={currentTime}
                  onSeek={seek}
                  // Put the sung line on the artwork's centre line, which is
                  // what the two-column layout lines up against.
                  centerOffset={coverHeight / 2}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
