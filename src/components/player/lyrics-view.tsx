"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { EMPTY_LYRICS, findActiveLine, parseLyrics, type Lyrics } from "@/lib/lrc";

/** Highlight a line this many seconds early so it is readable when sung. */
const LYRIC_LEAD_SECONDS = 0.35;
/** Manual scrolling suspends auto-follow for this long. */
const MANUAL_SCROLL_GRACE_MS = 4000;
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
function requestLyrics(url: string) {
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
      // Leave the empty placeholder in place; the view shows a fallback.
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
}

/**
 * One memoised list that follows playback. Auto-scrolling yields to manual
 * scrolling for a few seconds and collapses to instant jumps under
 * `prefers-reduced-motion`.
 */
export function LyricsView({ url, currentTime }: LyricsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const manualUntilRef = useRef(0);

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
    if (Date.now() < manualUntilRef.current) return;

    const container = containerRef.current;
    const line = lineRefs.current[activeIndex];
    if (!container || !line) return;

    // Centre via rects: offsetTop is relative to the nearest positioned
    // ancestor (the fixed player shell here), not the scroll container.
    const containerRect = container.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const target =
      container.scrollTop +
      (lineRect.top - containerRect.top) -
      container.clientHeight / 2 +
      lineRect.height / 2;
    container.scrollTo({
      top: Math.max(target, 0),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [activeIndex, reducedMotion]);

  const suspendAutoScroll = () => {
    manualUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
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
      className="h-full overflow-y-auto px-1 py-[45vh] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Lyrics"
    >
      {lyrics.timed.length === 0 && lyrics.untimed.length > 0 ? (
        <div className="space-y-4 text-2xl font-semibold leading-tight text-text-primary/60">
          {lyrics.untimed.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {lyrics.timed.map((line, index) => {
            const active = index === activeIndex;
            const secondaryRevealed =
              line.secondary != null && currentTime >= line.secondary.time;
            return (
              <p
                key={`${line.time}-${index}`}
                ref={(element) => {
                  lineRefs.current[index] = element;
                }}
                // Apple-Music lyric scale: large and bold, the current line
                // at full strength, the rest dimmed.
                className={`text-[32px] font-semibold leading-[1.25] transition-colors duration-300 ${
                  active
                    ? "text-text-primary"
                    : "text-text-primary/30 hover:text-text-primary/50"
                }`}
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
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
