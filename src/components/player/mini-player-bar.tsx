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
import { WaveformSeek } from "./wave-form-seek";

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
    seek,
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
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  const volumeDragRef = useRef(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

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
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const audio = audioRef.current;
      const el = coverRef.current;
      if (audio && el) {
        el.style.transform = `rotate(${audio.currentTime * 12}deg)`;
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
    <footer className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex h-14 max-w-4xl items-center gap-3 rounded-full border border-(--dz-hairline) bg-surface/50 p-1 pr-5 backdrop-blur-[48px] backdrop-saturate-[1.8] shell:left-[calc(var(--dz-sidebar-width)+16px)]">
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
            fits complete; longer titles truncate inside it. */}
        <span className="block w-40 shrink-0">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 truncate text-sm font-normal text-text-primary">
              {currentSong.title}
            </span>
            {/* 11px = the rendered cap height of the 14px title. */}
            {currentSong.explicit && (
              <ExplicitBadge className="h-[11px] w-[11px]" />
            )}
          </span>
          <span className="block truncate text-xs text-text-tertiary">
            {artist}
          </span>
        </span>
      </button>

      {/* Waveform sits right of the track info, transport right of it. */}
      <div className="ml-2 hidden min-w-0 flex-[2] items-center gap-3 md:flex">
        <span className="w-10 text-right text-xs tabular-nums text-text-primary">
          {formatTime(currentTime)}
        </span>
        <WaveformSeek
          url={currentSong.waveform}
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          className="min-w-0 flex-1"
          height={24}
        />
        <span className="w-10 text-xs tabular-nums text-text-primary">
          {formatTime(duration)}
        </span>
      </div>

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
          <IconShuffle className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary"
          aria-label="Previous track"
          onClick={previous}
        >
          <IconPrevious className="h-3.5 w-auto shrink-0" />
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
          <IconNext className="h-3.5 w-auto shrink-0" />
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
            <IconRepeatOne className="h-4 w-4" />
          ) : (
            <IconRepeat className="h-4 w-4" />
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
          <IconVolume className="h-4 w-auto" />
        </button>
        </div>
      </div>
    </footer>
  );
}
