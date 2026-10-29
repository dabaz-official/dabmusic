"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { EMPTY_LYRICS, findActiveLine, parseLyrics, type Lyrics } from "@/lib/lrc";

/** Highlight a line this many seconds early so it is readable when sung. */
const LYRIC_LEAD_SECONDS = 0.35;
/** Manual scrolling suspends auto-follow for this long. */
const MANUAL_SCROLL_GRACE_MS = 4000;
/** Height of the top fade, from Apple's lyric mask. */
const EDGE_FADE_PX = 80;
/** Glide between lyric lines. The browser's own smooth scroll cannot be tuned,
 *  so the move is tweened here; it matches the ease-out character of Apple's
 *  player (whose lyrics are canvas-drawn, so its curve cannot be sampled). */
const SCROLL_MS = 900;
/** Countdown before the first line: the dots light at 4s, 3s and 2s out, so the
 *  last one holds through the final two seconds. */
const COUNT_IN_SECONDS = 4;
/** How long the dots take to appear when the count-in starts. */
const COUNT_APPEAR_MS = 800;
/** How long they take to disappear once the first line starts. */
const COUNT_FADE_MS = 400;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Parsed lyrics per URL plus its subscribers, shared across mounts. */
const lyricsCache = new Map<string, Lyrics>();
const lyricsListeners = new Set<() => void>();

function emitLyricsChange() {
  for (const listener of lyricsListeners) listener();
}

/**
 * Fetches and parses a .lrc file into the cache; subscribers re-render via
 * useSyncExternalStore. Repeated requests for the same URL are no-ops.
 */
function requestLyrics(url: string, attempt = 0) {
  if (lyricsCache.has(url)) return;
  lyricsCache.set(url, EMPTY_LYRICS);

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`lyrics fetch failed: ${response.status}`);
      return response.text();
    })
    .then((source) => {
      lyricsCache.set(url, parseLyrics(source));
      emitLyricsChange();
    })
    .catch(() => {
      // Drop the placeholder so a later mount can try again, and retry here a
      // couple of times: a dev-server restart mid-request must not leave the
      // panel blank for the rest of the session.
      lyricsCache.delete(url);
      emitLyricsChange();
      if (attempt < 2) {
        window.setTimeout(() => requestLyrics(url, attempt + 1), 600 * (attempt + 1));
      }
    });
}

function subscribeLyrics(listener: () => void) {
  lyricsListeners.add(listener);
  return () => lyricsListeners.delete(listener);
}

function subscribeReducedMotion(listener: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

interface LyricsViewProps {
  url: string | undefined;
  currentTime: number;
  /** Clicking a line seeks to it; without it the lines stay inert. */
  onSeek?: (seconds: number) => void;
  /**
   * Where the active line should sit, in px from the top of the view. Defaults
   * to the vertical centre; the full-screen player passes half the artwork's
   * height so the sung line lines up with the artwork's centre.
   */
  centerOffset?: number;
  /**
   * Pin the active line's *top* this many px below the top of the view instead
   * of centring it. The single-column player uses it so the sung line hangs a
   * fixed distance under the compact header while the coming lines fill the
   * band down to the progress bar. The top edge fade ramps over exactly this
   * distance, so the pinned line still reads at full strength.
   */
  anchorTop?: number;
}

/**
 * One memoised list that follows playback. Auto-scrolling yields to manual
 * scrolling for a few seconds and collapses to instant jumps under
 * `prefers-reduced-motion`. The text is not selectable: a line is a seek
 * target, so a drag would only fight the click.
 */
export function LyricsView({
  url,
  currentTime,
  onSeek,
  centerOffset,
  anchorTop,
}: LyricsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLElement | null>>([]);
  /** Inner wrapper carrying the scroll-edge fade, separate from the hand-over
   *  opacity React drives on the line itself. */
  const contentRefs = useRef<Array<HTMLElement | null>>([]);
  /** Repaints (and re-anchors) on demand — held by the paint effect below. */
  const requestPaintRef = useRef<(() => void) | null>(null);
  /** The line the list has already been scrolled to, so it is not re-scrolled. */
  const anchoredFor = useRef(-1);
  /** In-flight glide, cancelled when a new line takes over or the reader scrolls. */
  const scrollFrameRef = useRef<number | null>(null);
  /** The count-in row, anchored like a line while nothing is sung yet. */
  const countRowRef = useRef<HTMLDivElement | null>(null);
  const manualUntilRef = useRef(0);
  /** Mirrors the manual-scroll grace period into render, so the blur drops. */
  const [manualScrolling, setManualScrolling] = useState(false);
  const manualTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (manualTimerRef.current) window.clearTimeout(manualTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (url) requestLyrics(url);
  }, [url]);

  const lyrics = useSyncExternalStore(
    subscribeLyrics,
    () => (url ? lyricsCache.get(url) ?? EMPTY_LYRICS : EMPTY_LYRICS),
    () => EMPTY_LYRICS,
  );

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );

  const activeIndex = useMemo(
    () => findActiveLine(lyrics.timed, currentTime, LYRIC_LEAD_SECONDS),
    [lyrics.timed, currentTime],
  );

  useEffect(() => {
    if (activeIndex < 0) return;
    requestPaintRef.current?.();
  }, [activeIndex, centerOffset, reducedMotion]);

  // Count-in: three dots in one lyric line's slot, lighting at 4s, 3s and 2s
  // before the first line, then fading out quickly once it starts. The row
  // holds its slot from the beginning of the track — it is the anchor before
  // anything is sung, with the first line below it — but the dots themselves
  // stay hidden until the count-down begins.
  const firstLineAt = lyrics.timed[0]?.time ?? 0;
  const secondsToFirst = firstLineAt - currentTime;
  // The row stays in the flow for the whole track — removing it later would
  // change the list's height and snap everything above the fold. Only its
  // opacity changes.
  const showCountDots = lyrics.timed.length > 0;
  const countStarted = secondsToFirst <= 0;
  const countVisible = !countStarted && secondsToFirst <= COUNT_IN_SECONDS;
  const countDot =
    secondsToFirst > COUNT_IN_SECONDS
      ? -1
      : secondsToFirst > COUNT_IN_SECONDS - 1
        ? 0
        : secondsToFirst > COUNT_IN_SECONDS - 2
          ? 1
          : 2;

  // Edge fade, one opacity per line. Apple fades its lyrics the same way — per
  // line — so a line that wraps keeps a single tone; a CSS mask over the
  // column would ramp *through* a two-row line and split its brightness.
  //
  // The factors hang off the line's own top and bottom edges rather than its
  // centre: a line half-scrolled past the top edge then reads as 0 instead of
  // being clipped at half strength, which is what made it look cut in two.
  // Profile matches their `--lyrics-linear-gradient`: fade in over the first
  // 80px, solid to the mid-point, then out to the bottom edge.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const paint = () => {
      frame = 0;
      const height = container.clientHeight;
      if (height === 0) return;
      const band = container.getBoundingClientRect();
      // Read every rect first, then write, so the writes cannot thrash layout.
      const rects = lineRefs.current.map((line) =>
        line ? line.getBoundingClientRect() : null,
      );
      const topZone =
        anchorTop !== undefined && anchorTop > 0 ? anchorTop : EDGE_FADE_PX;
      lineRefs.current.forEach((line, index) => {
        const rect = rects[index];
        const content = contentRefs.current[index];
        if (!rect || !content) return;
        const fadeIn = (rect.top - band.top) / topZone;
        const fadeOut = (band.bottom - rect.bottom) / (height * 0.5);
        const factor = Math.min(1, Math.max(0, Math.min(fadeIn, fadeOut)));
        content.style.opacity = factor.toFixed(3);
      });

      // Put the sung line on its anchor — once per change, so a reader's own
      // scrolling is never yanked back. Doing it here (rather than in an effect
      // on mount) means the measurement always happens after real layout.
      // Before the first line the count-in row takes the same slot, so the dots
      // are on screen for the countdown.
      const countRect = activeIndex < 0 ? countRowRef.current?.getBoundingClientRect() ?? null : null;
      const anchorRect = activeIndex >= 0 ? rects[activeIndex] : countRect;
      const anchorKey = activeIndex >= 0 ? activeIndex : -2;
      if (
        anchorRect &&
        anchoredFor.current !== anchorKey &&
        Date.now() >= manualUntilRef.current
      ) {
        anchoredFor.current = anchorKey;
        // Two ways to place the sung line: centred (optionally on the artwork's
        // centre line) or, with `anchorTop`, its top edge pinned a fixed
        // distance below the top of the view.
        const delta =
          anchorTop !== undefined
            ? anchorRect.top - (band.top + anchorTop)
            : anchorRect.top +
              anchorRect.height / 2 -
              (band.top +
                (centerOffset && centerOffset > 0 ? centerOffset : height / 2));
        if (Math.abs(delta) > 1) {
          // Own tween rather than `behavior: "smooth"`: the browser's duration
          // is fixed, and the hand-over reads better deliberately slow.
          if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
          const from = container.scrollTop;
          const to = Math.max(0, from + delta);
          if (reducedMotion) {
            container.scrollTop = to;
          } else {
            const startedAt = performance.now();
            const glide = (now: number) => {
              const t = Math.min(1, (now - startedAt) / SCROLL_MS);
              // Ease-out, the way Apple's own player moves: it sets off at
              // once and spends most of the time settling, rather than easing
              // in and out symmetrically.
              const eased = 1 - (1 - t) ** 3;
              container.scrollTop = from + (to - from) * eased;
              scrollFrameRef.current = t < 1 ? requestAnimationFrame(glide) : null;
            };
            scrollFrameRef.current = requestAnimationFrame(glide);
          }
        }
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    requestPaintRef.current = schedule;

    paint();
    container.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      requestPaintRef.current = null;
    };
  }, [
    lyrics.timed.length,
    activeIndex,
    centerOffset,
    anchorTop,
    reducedMotion,
    showCountDots,
  ]);

  const suspendAutoScroll = () => {
    manualUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
    // A glide in flight would fight the reader's own scrolling.
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
    // While the reader drives the list themselves, every line is crisp again;
    // the blur comes back with auto-follow.
    setManualScrolling(true);
    if (manualTimerRef.current) window.clearTimeout(manualTimerRef.current);
    manualTimerRef.current = window.setTimeout(() => {
      setManualScrolling(false);
      // Pull the list back to the sung line when the grace ends. Without this
      // nothing would move it again until the line changed — with playback
      // paused it never does, so the reader's scroll position stuck.
      anchoredFor.current = -1;
      requestPaintRef.current?.();
    }, MANUAL_SCROLL_GRACE_MS);
  };

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center text-base text-text-tertiary">
        No lyrics for this track.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onWheel={suspendAutoScroll}
      onTouchStart={suspendAutoScroll}
      className="h-full select-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Lyrics"
    >
      {/* The 45vh of air that lets the first and last lines reach the
          centre belongs inside the scroller: with border-box, padding on
          the scroller itself floors its height at 90vh, which overflowed
          the shorter slot the compact header leaves and shifted the whole
          panel up by 43px. */}
      <div className="py-[45vh]">
        {lyrics.timed.length === 0 && lyrics.untimed.length > 0 ? (
          <div className="space-y-4 text-2xl font-semibold leading-tight text-text-primary/60">
            {lyrics.untimed.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        ) : (
          <div className="space-y-7">
            {showCountDots && (
              <div
                ref={countRowRef}
                aria-hidden="true"
                // One lyric line's slot (32px × 1.25), so nothing moves when the
                // dots hand over to the first line. The fade is inline rather
                // than a utility class: the row is re-rendered on every time
                // tick, and a class-driven transition never got to run.
                className="flex h-10 items-center gap-3"
                style={{
                  opacity: countVisible ? 1 : 0,
                  // Appearing eases in slowly; disappearing is a quick 0.4s.
                  transition: `opacity ${
                    countVisible ? COUNT_APPEAR_MS : COUNT_FADE_MS
                  }ms ease-out`,
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={`h-4 w-4 rounded-full ${
                      dot === countDot ? "bg-text-primary" : "bg-text-primary/25"
                    }`}
                  />
                ))}
              </div>
            )}
            {lyrics.timed.map((line, index) => {
              const active = index === activeIndex;
              /** Sung lines leave on their own 1.5s clock — but only while the
               *  list is following playback. As soon as a reader scrolls with
               *  the wheel, everything is on screen again; the fade resumes a
               *  few seconds after they stop. */
              const past =
                !manualScrolling && activeIndex >= 0 && index < activeIndex;
              const secondaryRevealed =
                line.secondary != null && currentTime >= line.secondary.time;
              return (
                <button
                  type="button"
                  key={`${line.time}-${index}`}
                  ref={(element) => {
                    lineRefs.current[index] = element;
                  }}
                  onClick={onSeek ? () => onSeek(line.time) : undefined}
                  aria-label={`Seek to ${line.text}`}
                  aria-hidden={past || undefined}
                  // Apple-Music lyric treatment: the current line is crisp and
                  // full strength; every other line is dimmed and carries a soft
                  // blur (measured from their player — edge gradients drop from
                  // ~75 to ~15 against the current line's).
                  //
                  // The hand-over is asymmetric: a sung line fades all the way out
                  // over 1.5s, while the incoming line snaps on (duration-0) so
                  // the highlight moves instantly.
                  className={`block w-full text-left text-[32px] font-semibold leading-[1.25] transition-[opacity,color,filter] ease-out ${
                    past ? "duration-[1500ms]" : "duration-0"
                  } ${past ? "pointer-events-none opacity-0" : "opacity-100"} ${
                    onSeek ? "cursor-pointer" : "cursor-default"
                  } ${
                    active
                      ? "text-text-primary"
                      : `text-text-primary/30 ${
                          manualScrolling ? "blur-0" : "blur-[2px]"
                        }`
                  }`}
                >
                  {/* Scroll-edge fade lives here, so it never fights the
                      hand-over opacity on the button. */}
                  <span
                    ref={(element) => {
                      contentRefs.current[index] = element;
                    }}
                    className="block"
                  >
                    {line.text}
                    {line.secondary && (
                      <span
                        className={`block text-2xl font-semibold ${
                          secondaryRevealed && active
                            ? "text-text-primary/70"
                            : "text-text-primary/20"
                        }`}
                      >
                        {line.secondary.text}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
