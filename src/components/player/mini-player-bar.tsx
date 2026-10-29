"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ExplicitBadge } from "@/components/explicit-badge";
import { DabMark } from "@/components/dab-mark";
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

/**
 * The "this mode is on" dot, Spotify-style: a small circle centred under the
 * shuffle / repeat glyph. Absolute so it never shifts the icon, and it takes
 * `currentColor` — the buttons already turn `text-primary` when active. The
 * size is a prop while the two are being compared side by side.
 */
function ActiveDot({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 4 4"
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[4px] left-1/2 -translate-x-1/2"
    >
      <rect width="4" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}

/**
 * The persistent transport — a floating pill that hugs the spinning cover.
 * Deliberately plain; the owner restyles it. Spans the content column:
 * full width below sm, offset by the sidebar from sm up.
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
    audioRef,
    shuffle,
    toggleShuffle,
    repeat,
    cycleRepeat,
    volume,
    changeVolume,
    toggleMute,
    setExpanded,
  } = usePlayer();

  const coverRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGRectElement>(null);
  const pillRef = useRef<HTMLElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const volumeDragRef = useRef(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  /** The pill's own width, so the ring's rect can be drawn in real pixels. */
  const [pillWidth, setPillWidth] = useState(0);

  // The portalled popup has no parent to position it, so it is placed against
  // the volume button's box: 10px to its left, vertically centred on the pill.
  // Written straight to the node — no state, no extra render.
  useLayoutEffect(() => {
    if (!volumeOpen) return;
    const place = () => {
      const icon = volumeRef.current?.getBoundingClientRect();
      const pill = pillRef.current?.getBoundingClientRect();
      const popup = volumePopupRef.current;
      if (!icon || !pill || !popup) return;
      // Position from the LEFT edge, not `right`: the fixed containing block
      // here is 1265.8px wide while `clientWidth` rounds to 1266, and a
      // right-anchored box inherits that 0.2px — which reads as the icon
      // nudging sideways the moment the popup opens. The left origin is exact,
      // and `offsetWidth` is the width the flex children actually take.
      popup.style.left = `${icon.right + 6 - popup.offsetWidth}px`;
      popup.style.top = `${pill.top + (pill.height - 40) / 2}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [volumeOpen]);

  // The pill's width is fluid (capped at 668px), so the ring is re-measured
  // rather than guessed: an SVG rect cannot express `width: calc(100% - 2px)`.
  useEffect(() => {
    const el = pillRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setPillWidth(el.getBoundingClientRect().width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const volumeFromClientX = useCallback(
    (clientX: number) => {
      const slider = volumeSliderRef.current;
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      changeVolume(ratio);
    },
    [changeVolume],
  );

  // The popup dismisses on mouse-leave (see the container below); Escape is
  // the keyboard equivalent. No outside-click handler any more — leaving the
  // bar covers it, and closing mid-drag is avoided by the drag flag.
  useEffect(() => {
    if (!volumeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVolumeOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [volumeOpen]);

  // Vinyl spin: the cover's angle is bound to the audio element's position
  // (12°/s, one revolution per 30s). Playing advances it clockwise, pausing
  // freezes it, seeking forward/backward spins it accordingly. Driven by
  // rAF reading the element directly, so it is smooth without re-renders.
  // The progress ring rides in the same frame and off the same `currentTime`,
  // so the two can never drift apart.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      const el = coverRef.current;
      const ring = ringRef.current;
      if (audio) {
        if (el) el.style.transform = `rotate(${audio.currentTime * 12}deg)`;
        if (ring) {
          const total = audio.duration;
          const played =
            Number.isFinite(total) && total > 0
              ? Math.min(1, Math.max(0, audio.currentTime / total))
              : 0;
          // The path is normalised to 100 units (`pathLength`), so the offset
          // is just the unplayed share.
          ring.style.strokeDashoffset = String(100 * (1 - played));
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef]);

  // Nothing loaded yet is not "no player": the pill is part of the page, so it
  // renders in an idle state with a placeholder artwork and no track text.
  const idle = !currentSong || !currentAlbum;
  const cover = idle ? undefined : (currentSong.cover ?? currentAlbum.cover);
  const artist = idle ? undefined : (currentSong.artist ?? currentAlbum.artist);
  // Idle buttons sit back at the artist line's grey; the volume button keeps
  // full strength even then, because it still does something.
  const idleButton = idle ? "text-text-tertiary" : "text-text-primary";

  return (
    // The pill's material is Apple's own (`chrome-player::before`): the glass
    // wash shared with their sidebar — blur(16px) saturate(2.2) — and no
    // border. 54px tall and 668px wide at most, both measured there too; the
    // 3px padding is what makes the 48px cover fit exactly (3 + 48 + 3).
    <footer ref={pillRef} className="dz-player-inset fixed bottom-4 z-10 mx-auto flex h-[54px] max-w-[668px] items-center gap-3 rounded-full bg-(--dz-player-bg) p-[3px] pr-[13px] backdrop-blur-[16px] backdrop-saturate-[2.2]">
      {/* Progress ring: the pill's outline itself, drawn clockwise from the
          cover's topmost point. A rounded rect's path starts at `(x + rx, y)`
          — with y=1 and rx=26 that is x=27, the cover's centre (3px padding +
          half of its 48px) — so `rx` does the starting-point work for free.
          `pathLength=100` normalises the dash maths. No progress bar remains
          down here: this is the only seek indication in the pill.

          The track is the title colour at 25%. Its left cap is the one place
          where unplayed turns into played — the arc comes back around the
          bottom and rises past the cover — so that cap alone fades from the
          track colour at the cover's bottom to the full progress colour at its
          top, which makes the wrap read as a hand-over instead of a jump. The
          remaining three quarters of the track stay flat. */}
      {pillWidth > 0 && (
        <svg
          aria-hidden="true"
          width={pillWidth}
          height={54}
          className="pointer-events-none absolute inset-0 overflow-visible text-text-primary"
        >
          {idle ? (
            // Nothing playing: one flat ring, no gradient and no arc.
            <rect
              x={1}
              y={1}
              width={pillWidth - 2}
              height={52}
              rx={26}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeOpacity={0.25}
            />
          ) : (
            <>
              <defs>
                {/* Cover spans y 3–51 inside the pill (3px padding + 48px). */}
                <linearGradient
                  id="dz-player-ring-fade"
                  gradientUnits="userSpaceOnUse"
                  x1="27"
                  y1="51"
                  x2="27"
                  y2="3"
                >
                  <stop offset="0" style={{ stopColor: "var(--dz-color-text-primary)", stopOpacity: 0.25 }} />
                  <stop offset="1" style={{ stopColor: "var(--dz-color-text-primary)", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              {/* Track, minus the left cap: top edge → right cap → bottom edge,
                  ending under the cover. */}
              <path
                d={`M 27 1 L ${pillWidth - 27} 1 A 26 26 0 0 1 ${pillWidth - 27} 53 L 27 53`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeOpacity={0.25}
              />
              {/* Left cap: bottom of the cover up to its top, i.e. the direction
                  the arc itself travels last. */}
              <path
                d="M 27 53 A 26 26 0 0 1 27 1"
                fill="none"
                stroke="url(#dz-player-ring-fade)"
                strokeWidth={2}
              />
              <rect
                ref={ringRef}
                x={1}
                y={1}
                width={pillWidth - 2}
                height={52}
                rx={26}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                pathLength={100}
                strokeDasharray={100}
                style={{ strokeDashoffset: 100 }}
              />
            </>
          )}
        </svg>
      )}
      {/* Volume popup. It is portalled to <body> and only *positioned* over the
          pill: a `backdrop-filter` element establishes a backdrop root, so a
          blur nested inside the pill samples the pill's own interior and
          renders as nothing at all. Outside it, the blur and the saturation
          finally show.

          The icon lives inside the popup as well, at its right end, so the
          three gaps read the same 10px: popup → track, track → icon, icon →
          popup. The icon sits in a 28px hit box around 20px of ink, so its
          box-to-ink inset is 4px and the box gaps are 10 − 4 = 6px. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {volumeOpen && (
              <div
                ref={volumePopupRef}
                className="fixed top-0 left-0 z-50 flex h-10 [&_button]:cursor-pointer items-center gap-[6px] pr-[6px] pl-[10px]"
                onMouseLeave={() => {
                  // Never yank the bar away mid-drag.
                  if (!volumeDragRef.current) setVolumeOpen(false);
                }}
              >
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-(--dz-player-bg) backdrop-blur-[60px] backdrop-saturate-[2]"
                  style={{ originX: 1 }}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  // Leaves by fading only — retracting would read as a bounce.
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                />
                <motion.div
                  ref={volumeSliderRef}
                  role="slider"
                  aria-label="Volume"
                  aria-orientation="horizontal"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(volume * 100)}
                  tabIndex={0}
                  // The hit area is the popup's full height across the bar's
                  // width, not the 4px track: anywhere from the pill's top edge
                  // to its bottom edge, within the bar's span, works for a
                  // click or a drag. The track stays a 4px line centred in it.
                  className="relative flex h-full w-[80px] shrink-0 cursor-pointer touch-none items-center"
                  style={{ touchAction: "none", originX: 1 }}
                  // The bar itself extends out of the icon too, in step with its
                  // background, instead of fading in place.
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                  onPointerDown={(event) => {
                    volumeDragRef.current = true;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    volumeFromClientX(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    if (volumeDragRef.current) volumeFromClientX(event.clientX);
                  }}
                  onPointerUp={() => {
                    volumeDragRef.current = false;
                  }}
                  onKeyDown={(event) => {
                    const step = 0.05;
                    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
                      changeVolume(volume + step);
                    } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
                      changeVolume(volume - step);
                    } else {
                      return;
                    }
                    event.preventDefault();
                  }}
                >
                  <span className="relative block h-1 w-full rounded-full bg-text-primary/25">
                    <span
                      className="absolute top-0 left-0 h-full rounded-full bg-text-primary"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </span>
                </motion.div>
                {/* Same 28px hit box and same glyph as the pill's own button,
                    placed where that button sits so opening the popup does not
                    move the icon. While the popup is open it mutes instead of
                    closing — the popup dismisses itself when the pointer
                    leaves — so the icon behaves the same as the one in the
                    full-screen player. */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={volume === 0 ? "Unmute" : "Mute"}
                  aria-pressed={volume === 0}
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center text-text-primary"
                >
                  <IconVolume volume={volume} className="h-[15px] w-auto" />
                </button>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      {/* The whole pill opens the full-screen player, not just the artwork:
          a transparent button covers it and the transport sits above it (z-10),
          so any click that is not on a control lands here. It keeps the
          default cursor — only the controls read as clickable — and stays
          keyboard-reachable as one button. Nothing is loaded in the idle
          state, so there is no full-screen view to open. */}
      {!idle && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Open full-screen player"
          className="absolute inset-0 z-[1] cursor-default rounded-full"
        />
      )}
      <div className="flex min-w-0 items-center gap-3 text-left">
        {/* 44px artwork inside a 48px slot: the slot is what the ring's start
            point and the row's rhythm were built around (the pill's 3px
            padding + half of 48 = x 27, the top of the left cap), so the
            canvas stays and only the artwork shrinks inside it. */}
        <span ref={coverRef} className="flex h-12 w-12 shrink-0 items-center justify-center will-change-transform">
          {idle ? (
            // Empty state: Apple's "missing artwork" colours (their
            // --playerMissingArtworkBg / -Icon) as a disc carrying the DabAZ
            // mark — the owner's 360×360 glyph, not the wordmark.
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--dz-player-art-bg)">
              <DabMark className="h-[22px] w-[22px] text-(--dz-player-art-fg)" />
            </span>
          ) : (
            <Image
              src={cover ?? ""}
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
          )}
        </span>
        {/* Fixed-width info: sized so the longest title (LOVE GOT ME NUMB)
            fits complete; longer titles truncate inside it. The title uses the
            album grid's card metrics (12px / 15px) so the pill and the shelves
            speak the same size; the artist sits a step below it, and the times
            match the artist. None of it exists before a track is loaded. */}
        {!idle && (
          <span className="block w-40 min-w-0 shrink">
            {/* `items-center`, not the grid's `items-baseline`: the badge is a
                filled square, so baseline alignment hangs it from the baseline
                and reads low. Centring it against the title's line box puts it
                on the capitals' optical centre. Same 10px mark as the cards. */}
            <span className="flex items-center gap-1">
              <span className="min-w-0 truncate text-xs font-normal leading-[15px] text-text-primary">
                {currentSong.title}
              </span>
              {currentSong.explicit && (
                <ExplicitBadge className="h-[10px] w-[10px]" />
              )}
            </span>
            <span className="block truncate text-[11px] leading-[13px] text-text-tertiary">
              {artist}
            </span>
          </span>
        )}
      </div>

      {/* No progress bar any more — the ring on the pill's rim carries that —
          so the times collapse into one right-aligned pair next to the
          transport instead of bracketing an empty slot. Nothing to time yet
          before a track is loaded. */}
      {!idle && (
        <span className="ml-auto hidden text-[11px] tabular-nums text-text-primary pill:block">
          {formatTime(currentTime)}
          <span className="text-text-tertiary"> / </span>
          {formatTime(duration)}
        </span>
      )}

      {/* All six controls share one row: identical 28px hit boxes and one
          uniform gap, so the spacing between every icon pair is equal. */}
      <div
        className={`relative z-10 ml-auto flex items-center gap-1 [&_button]:cursor-pointer ${
          idle ? "" : "pill:ml-0"
        }`}
      >
        {/* Off is the artist line's grey, on is full strength: with both states
            at `text-secondary` the two were nearly indistinguishable. */}
        <button
          type="button"
          className={`relative hidden h-7 w-7 pill:flex items-center justify-center rounded-md ${
            shuffle && !idle ? "text-text-primary" : "text-text-tertiary"
          }`}
          aria-label="Shuffle"
          aria-pressed={shuffle}
          onClick={toggleShuffle}
        >
          <IconShuffle className="h-[11.5px] w-[11.5px]" />
          {shuffle && !idle && <ActiveDot size={2} />}
        </button>
        <button
          type="button"
          className={`hidden h-7 w-7 pill:flex items-center justify-center rounded-md ${idleButton}`}
          aria-label="Previous track"
          onClick={previous}
        >
          <IconPrevious className="h-[11px] w-auto shrink-0" />
        </button>
        {/* Play/pause share the same 22×24 slot, no circular background —
            swapping never moves the glyph. Pressing it shrinks the glyph to
            exactly the next track's height (20 → 11 above 830px, 18 → 14.4
            below it) and eases it back on release. */}
        <button
          type="button"
          className={`flex h-7 w-7 items-center justify-center transition-transform duration-150 ease-out active:scale-[0.8] pill:active:scale-[0.55] ${idleButton}`}
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          <PlayPauseIcon playing={isPlaying} className="h-[18px] w-auto pill:h-5" />
        </button>
        {/* Below 800px this is the last control, so its right gap is the pill's
            edge distance. The glyph is centred in a 54px pill and 16px tall, so
            its top gap is 19px; the 6.65px margin makes the right gap match it
            (the 28px hit box is narrower than the 29.3px glyph by 0.65px a
            side, which is where the fraction comes from). The left margin does
            the same for the play glyph's gap — 12.2 on top of the row's 4px
            gap lands it at 19 as well. */}
        <button
          type="button"
          className={`max-pill:ml-[10.45px] flex h-7 w-7 items-center justify-center rounded-md max-pill:mr-[6px] ${idleButton}`}
          aria-label="Next track"
          onClick={next}
        >
          <IconNext className="h-[14.4px] w-auto shrink-0 pill:h-[11px]" />
        </button>
        <button
          type="button"
          className={`relative hidden h-7 w-7 pill:flex items-center justify-center rounded-md ${
            repeat !== "off" && !idle ? "text-text-primary" : "text-text-tertiary"
          }`}
          aria-label={`Repeat: ${repeat}`}
          aria-pressed={repeat !== "off"}
          onClick={cycleRepeat}
        >
          {repeat === "one" ? (
            <IconRepeatOne className="h-[11.5px] w-[11.5px]" />
          ) : (
            <IconRepeat className="h-[11.5px] w-[11.5px]" />
          )}
          {repeat !== "off" && !idle && <ActiveDot size={2} />}
        </button>

        {/* Volume: the popup holds its own copy of this button at the same
            spot, so while it is open this one goes transparent — otherwise the
            blurred original would show through behind the sharp copy. Same
            colour as the copy at every volume, so the icon does not change
            tint when the popup takes over. */}
        <div ref={volumeRef} className="relative hidden pill:block">
          <button
          type="button"
          className={`flex h-7 w-7 items-center justify-center rounded-md text-text-primary ${
            volumeOpen ? "opacity-0" : ""
          }`}
          aria-label="Volume"
          aria-expanded={volumeOpen}
          onClick={() => setVolumeOpen((open) => !open)}
        >
          <IconVolume volume={volume} className="h-[15px] w-auto" />
        </button>
        </div>
      </div>
    </footer>
  );
}
