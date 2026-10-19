'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import type { LyricLine } from '@/lib/lrc';

/** How long auto-follow stays paused after the listener stops touching the lyrics. */
const RESUME_DELAY_MS = 2400;
/** Exponential smoothing time constant. Smaller feels snappier, larger feels heavier. */
const SMOOTHING_MS = 170;
/** Once the remaining distance is this small the follow snaps and stops animating. */
const SETTLE_PX = 1;
/** If no animation frame has run by now, the frame loop is stalled — snap instead. */
const STALLED_FRAME_MS = 500;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Options {
  containerRef: RefObject<HTMLElement | null>;
  /** Element of the currently highlighted line; refreshed by the view. */
  activeLineRef: RefObject<HTMLElement | null>;
  activeIndex: number;
  /** Identity of the line set, used to detect a track change. */
  lines: LyricLine[];
}

/**
 * Keeps the active lyric line centred by easing the scroll container towards it
 * once per frame instead of calling `scrollIntoView`. That gives a continuous,
 * interruptible glide, never scrolls ancestor containers, and yields the moment
 * the listener starts scrolling by hand.
 *
 * Returns `true` while the listener has taken over the scroll position.
 */
export function useLyricsAutoScroll({ containerRef, activeLineRef, activeIndex, lines }: Options): boolean {
  const [isBrowsing, setIsBrowsing] = useState(false);

  const frameRef = useRef(0);
  const framesRunRef = useRef(0);
  const watchdogRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const lastFrameRef = useRef(0);
  const browsingRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const placedLinesRef = useRef<LyricLine[] | null>(null);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  /** Scroll offset that puts the active line in the middle of the container. */
  const measure = useCallback((): number => {
    const container = containerRef.current;
    const line = activeLineRef.current;
    if (!container) return 0;
    if (activeIndex < 0 || !line?.isConnected) return 0;

    const containerRect = container.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const centred =
      container.scrollTop + (lineRect.top - containerRect.top) - (container.clientHeight - lineRect.height) / 2;

    const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 0);
    return Math.min(Math.max(centred, 0), maxScroll);
  }, [containerRef, activeLineRef, activeIndex]);

  const applyTarget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = targetRef.current;
    positionRef.current = targetRef.current;
  }, [containerRef]);

  const step = useCallback(
    (now: number) => {
      framesRunRef.current += 1;

      const container = containerRef.current;
      if (!container) {
        frameRef.current = 0;
        return;
      }

      // Clamp the frame delta so a background tab does not produce a jump.
      const elapsed = Math.min(now - lastFrameRef.current, 64);
      lastFrameRef.current = now;

      const distance = targetRef.current - positionRef.current;
      if (Math.abs(distance) <= SETTLE_PX) {
        frameRef.current = 0;
        clearWatchdog();
        applyTarget();
        return;
      }

      // Frame-rate independent easing towards the target.
      positionRef.current += distance * (1 - Math.exp(-elapsed / SMOOTHING_MS));
      container.scrollTop = positionRef.current;
      frameRef.current = requestAnimationFrame(step);
    },
    [applyTarget, clearWatchdog, containerRef],
  );

  const follow = useCallback(
    (instant = false) => {
      const container = containerRef.current;
      if (!container) return;

      targetRef.current = measure();

      if (instant || prefersReducedMotion()) {
        stop();
        clearWatchdog();
        applyTarget();
        return;
      }

      positionRef.current = container.scrollTop;
      if (!frameRef.current) {
        lastFrameRef.current = performance.now();
        frameRef.current = requestAnimationFrame(step);
      }

      // Frames stop arriving while a document is hidden or throttled. Without a
      // fallback the view would be left stranded on the wrong line, so snap if
      // the loop has not managed a single frame by the deadline.
      clearWatchdog();
      const framesWhenArmed = framesRunRef.current;
      watchdogRef.current = window.setTimeout(() => {
        watchdogRef.current = null;
        if (frameRef.current && framesRunRef.current === framesWhenArmed) {
          stop();
          applyTarget();
        }
      }, STALLED_FRAME_MS);
    },
    [applyTarget, clearWatchdog, containerRef, measure, step, stop],
  );

  const resume = useCallback(() => {
    resumeTimerRef.current = null;
    browsingRef.current = false;
    setIsBrowsing(false);
    follow();
  }, [follow]);

  const suspend = useCallback(() => {
    if (!browsingRef.current) {
      browsingRef.current = true;
      setIsBrowsing(true);
    }
    stop();
    clearWatchdog();
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(resume, RESUME_DELAY_MS);
  }, [clearWatchdog, resume, stop]);

  // A new track starts from a clean slate: place instantly instead of gliding
  // across the whole previous song's worth of lyrics.
  useLayoutEffect(() => {
    if (browsingRef.current) return;
    const isNewTrack = placedLinesRef.current !== lines;
    placedLinesRef.current = lines;
    follow(isNewTrack);
  }, [activeIndex, lines, follow]);

  // Hand control to the listener on real input, then glide back once they settle.
  // Programmatic scrolling is deliberately not observed, so our own frames never
  // read as user intent.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onUserInput = () => suspend();
    container.addEventListener('wheel', onUserInput, { passive: true });
    container.addEventListener('touchstart', onUserInput, { passive: true });
    container.addEventListener('touchmove', onUserInput, { passive: true });
    container.addEventListener('pointerdown', onUserInput, { passive: true });

    return () => {
      container.removeEventListener('wheel', onUserInput);
      container.removeEventListener('touchstart', onUserInput);
      container.removeEventListener('touchmove', onUserInput);
      container.removeEventListener('pointerdown', onUserInput);
    };
  }, [containerRef, suspend]);

  // Panel width, viewport height and font metrics all move the centre line.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!browsingRef.current) follow();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, follow]);

  useEffect(
    () => () => {
      stop();
      clearWatchdog();
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    },
    [clearWatchdog, stop],
  );

  return isBrowsing;
}
