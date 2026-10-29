"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

/**
 * Pre-computed waveform peaks per URL, fetched once and cached module-wide.
 * Values: undefined = loading, number[] = ready, null = fetch failed.
 */
const peaksCache = new Map<string, number[] | null>();
const peaksListeners = new Set<() => void>();

function emitPeaksChange() {
  for (const listener of peaksListeners) listener();
}

function requestPeaks(url: string) {
  if (peaksCache.has(url)) return;
  peaksCache.set(url, null);

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`waveform fetch failed: ${response.status}`);
      return response.json() as Promise<{ peaks: number[] }>;
    })
    .then(({ peaks }) => {
      peaksCache.set(url, peaks);
      emitPeaksChange();
    })
    .catch(() => {
      peaksCache.set(url, null);
      emitPeaksChange();
    });
}

function subscribePeaks(listener: () => void) {
  peaksListeners.add(listener);
  return () => peaksListeners.delete(listener);
}

interface WaveformSeekProps {
  /** The song's waveform JSON URL; undefined falls back to a plain bar. */
  url: string | undefined;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  /**
   * Fires once a pointer drag has actually moved (a plain click does not call
   * it), so the player can pause while the position is being dragged.
   */
  onScrubStart?: () => void;
  /** Fires when that drag ends, after the final seek has been applied. */
  onScrubEnd?: () => void;
  className?: string;
  /** Height of the waveform area in px. */
  height?: number;
}

export function WaveformSeek({
  url,
  currentTime,
  duration,
  onSeek,
  onScrubStart,
  onScrubEnd,
  className,
  height = 40,
}: WaveformSeekProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Width in CSS px, tracked by the resize observer. */
  const widthRef = useRef(0);
  const draggingRef = useRef(false);
  /** Whether the current drag has moved far enough to count as a scrub. */
  const scrubbedRef = useRef(false);

  const peaks = useSyncExternalStore(
    subscribePeaks,
    () => (url ? peaksCache.get(url) ?? undefined : null),
    () => undefined,
  );

  useEffect(() => {
    if (url) requestPeaks(url);
  }, [url]);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const wrap = wrapRef.current;
      if (!wrap || duration <= 0) return;
      const rect = wrap.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  // Redraw whenever the data, position, size or theme changes.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = widthRef.current;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Colours measured from music.apple.com's full-screen player: solid
      // white played over a 64% white track. The full-screen player pins the
      // dark palette, so these hold in light mode too.
      const playedColor = "#ffffff";
      const restColor = "rgba(255, 255, 255, 0.64)";

      const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
      const playedWidth = width * progress;

      if (!peaks || peaks.length === 0) {
        // Fallback: a plain 2px progress line while peaks load/failed.
        ctx.fillStyle = restColor;
        ctx.fillRect(0, height / 2 - 1, width, 2);
        ctx.fillStyle = playedColor;
        ctx.fillRect(0, height / 2 - 1, playedWidth, 2);
        return;
      }

      // Aggregate peaks into one bar per ~3px so any width looks even.
      const barCount = Math.max(40, Math.floor(width / 3));
      const barWidth = width / barCount;
      ctx.fillStyle = restColor;
      for (let bar = 0; bar < barCount; bar++) {
        const start = Math.floor((bar / barCount) * peaks.length);
        const end = Math.max(start + 1, Math.floor(((bar + 1) / barCount) * peaks.length));
        let peak = 0;
        for (let i = start; i < end; i++) peak = Math.max(peak, peaks[i]);
        const barHeight = Math.max(2, peak * height);
        const x = bar * barWidth;
        if (x + barWidth <= playedWidth) {
          ctx.fillStyle = playedColor;
          ctx.fillRect(x, (height - barHeight) / 2, Math.max(barWidth - 1, 1), barHeight);
        } else {
          ctx.fillStyle = restColor;
          ctx.fillRect(x, (height - barHeight) / 2, Math.max(barWidth - 1, 1), barHeight);
        }
      }
    };

    draw();

    const observer = new ResizeObserver((entries) => {
      widthRef.current = entries[0].contentRect.width;
      canvas.style.width = `${widthRef.current}px`;
      draw();
    });
    observer.observe(wrap);

    return () => {
      observer.disconnect();
    };
  }, [peaks, currentTime, duration, height]);

  return (
    <div
      ref={wrapRef}
      className={`cursor-pointer ${className ?? ""}`}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      style={{ height: height, touchAction: "none" }}
      onPointerDown={(event) => {
        draggingRef.current = true;
        scrubbedRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        seekFromClientX(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        if (!scrubbedRef.current) {
          scrubbedRef.current = true;
          onScrubStart?.();
        }
        seekFromClientX(event.clientX);
      }}
      onPointerUp={(event) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        // The pointer can be released without a final move; land on it anyway.
        seekFromClientX(event.clientX);
        if (scrubbedRef.current) {
          scrubbedRef.current = false;
          onScrubEnd?.();
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
        if (scrubbedRef.current) {
          scrubbedRef.current = false;
          onScrubEnd?.();
        }
      }}
      onKeyDown={(event) => {
        const step = 5;
        if (event.key === "ArrowLeft") {
          onSeek(Math.max(0, currentTime - step));
        } else if (event.key === "ArrowRight") {
          onSeek(Math.min(duration, currentTime + step));
        } else if (event.key === "Home") {
          onSeek(0);
        } else if (event.key === "End") {
          onSeek(duration);
        } else {
          return;
        }
        event.preventDefault();
      }}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none block"
        style={{ width: "100%", height: height }}
      />
    </div>
  );
}
