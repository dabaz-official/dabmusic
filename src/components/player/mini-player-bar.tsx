"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** The pill's own width, so the ring's rect can be drawn in real pixels. */
  const [pillWidth, setPillWidth] = useState(0);

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

  const volumeFromClientY = useCallback(
    (clientY: number) => {
      const slider = volumeSliderRef.current;
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (rect.bottom - clientY) / rect.height));
      changeVolume(ratio);
    },
    [changeVolume],
  );

  // Close the volume popup on outside clicks and Escape. The popup lives
  // centered above the bar, outside the button's subtree — both refs count
  // as "inside".
  useEffect(() => {
    if (!volumeOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !volumeRef.current?.contains(target) &&
        !volumePopupRef.current?.contains(target)
      ) {
        setVolumeOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVolumeOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
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

  if (!currentSong || !currentAlbum) return null;

  const cover = currentSong.cover ?? currentAlbum.cover;
  const artist = currentSong.artist ?? currentAlbum.artist;

  return (
    // The pill's material is Apple's own (`chrome-player::before`): the glass
    // wash shared with their sidebar — blur(16px) saturate(2.2) — and no
    // border. 54px tall and 668px wide at most, both measured there too; the
    // 3px padding is what makes the 48px cover fit exactly (3 + 48 + 3).
    <footer ref={pillRef} className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex h-[54px] max-w-[668px] items-center gap-3 rounded-full bg-(--dz-player-bg) p-[3px] pr-5 backdrop-blur-[16px] backdrop-saturate-[2.2] shell:left-[calc(var(--dz-sidebar-width)+16px)]">
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
        </svg>
      )}
      {/* Volume popup: centered above the bar, Apple-Music style — the
          material recipe measured from their own popover (blur 60px,
          saturate 2×, 60% surface, pill) around a custom vertical slider. */}
      {volumeOpen && (
        <div
          ref={volumePopupRef}
          className="absolute bottom-full left-1/2 mb-3 flex h-36 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-(--dz-hairline) bg-surface/60 backdrop-blur-[60px] backdrop-saturate-[2]"
        >
          <div
            ref={volumeSliderRef}
            role="slider"
            aria-label="Volume"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            tabIndex={0}
            className="relative h-28 w-1 cursor-pointer touch-none rounded-full bg-border-strong"
            style={{ touchAction: "none" }}
            onPointerDown={(event) => {
              volumeDragRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              volumeFromClientY(event.clientY);
            }}
            onPointerMove={(event) => {
              if (volumeDragRef.current) volumeFromClientY(event.clientY);
            }}
            onPointerUp={() => {
              volumeDragRef.current = false;
            }}
            onKeyDown={(event) => {
              const step = 0.05;
              if (event.key === "ArrowUp") changeVolume(volume + step);
              else if (event.key === "ArrowDown") changeVolume(volume - step);
              else return;
              event.preventDefault();
            }}
          >
            <div
              className="absolute bottom-0 left-0 w-full rounded-full bg-text-primary"
              style={{ height: `${volume * 100}%` }}
            />
          </div>
        </div>
      )}
      {/* Cover and title open the full-screen player. */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Open full-screen player"
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <span ref={coverRef} className="block h-12 w-12 shrink-0 will-change-transform">
          <Image
            src={cover}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        </span>
        {/* Fixed-width info: sized so the longest title (LOVE GOT ME NUMB)
            fits complete; longer titles truncate inside it. The title uses the
            album grid's card metrics (12px / 15px) so the pill and the shelves
            speak the same size; the artist sits a step below it, and the times
            match the artist. */}
        <span className="block w-40 shrink-0">
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
      </button>

      {/* No progress bar any more — the ring on the pill's rim carries that —
          so the times collapse into one right-aligned pair next to the
          transport instead of bracketing an empty slot. */}
      <span className="ml-auto hidden text-[11px] tabular-nums text-text-primary md:block">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* All six controls share one row: identical 28px hit boxes and one
          uniform gap, so the spacing between every icon pair is equal. */}
      <div className="hidden items-center gap-1 md:flex">
        <button
          type="button"
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            shuffle ? "text-text-primary" : "text-text-secondary"
          }`}
          aria-label="Shuffle"
          aria-pressed={shuffle}
          onClick={toggleShuffle}
        >
          <IconShuffle className="h-[11.5px] w-[11.5px]" />
        </button>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary"
          aria-label="Previous track"
          onClick={previous}
        >
          <IconPrevious className="h-[11px] w-auto shrink-0" />
        </button>
        {/* Play/pause share the same 22×24 slot, no circular background —
            swapping never moves the glyph. */}
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center text-text-primary"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlay}
        >
          <PlayPauseIcon playing={isPlaying} className="h-5 w-auto" />
        </button>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary"
          aria-label="Next track"
          onClick={next}
        >
          <IconNext className="h-[11px] w-auto shrink-0" />
        </button>
        <button
          type="button"
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            repeat !== "off" ? "text-text-primary" : "text-text-secondary"
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
        </button>

        {/* Volume: popup uses the recipe measured from music.apple.com's own
            volume popover — blur(60px) saturate(2) over a 60% surface pill. */}
        <div ref={volumeRef} className="relative">
          <button
          type="button"
          className={`flex h-7 w-7 items-center justify-center rounded-md ${
            volume === 0 ? "text-text-tertiary" : "text-text-secondary"
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
