'use client';

import { memo, useCallback, useRef, type ReactNode } from 'react';

import { useLyricsAutoScroll } from '@/hooks/useLyricsAutoScroll';
import type { Lyrics } from '@/lib/lrc';
import { cn } from '@/lib/utils';

interface LyricsViewProps {
  lyrics: Lyrics;
  /** Index of the highlighted line, or -1 before the first one. */
  activeIndex: number;
  secondaryRevealed: boolean;
  onSeek: (seconds: number) => void;
  /** `panel` keeps inactive lines softly blurred; `sheet` favours mobile paint cost. */
  variant: 'panel' | 'sheet';
  /** Shown when the track has no lyrics at all. */
  emptyState: ReactNode;
  className?: string;
}

/** The edge fades have to match the surface they sit on. */
const EDGE_FADE: Record<LyricsViewProps['variant'], string> = {
  panel: 'from-white dark:from-black',
  sheet: 'from-neutral-100 dark:from-neutral-900',
};

function LyricsView({
  lyrics,
  activeIndex,
  secondaryRevealed,
  onSeek,
  variant,
  emptyState,
  className,
}: LyricsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Only the highlighted line registers itself, so the follow never measures a
  // stale node.
  const setActiveLineRef = useCallback((element: HTMLDivElement | null) => {
    if (element) activeLineRef.current = element;
  }, []);

  const isBrowsing = useLyricsAutoScroll({
    containerRef,
    activeLineRef,
    activeIndex,
    lines: lyrics.timed,
  });

  const scrollClassName = cn('relative overflow-y-auto overscroll-contain', className);

  if (lyrics.timed.length === 0) {
    if (lyrics.untimed.length > 0) {
      return (
        <div className={scrollClassName}>
          <div className="py-[30vh]">
            {lyrics.untimed.map((line, index) => (
              <p
                key={`${index}-${line}`}
                className="py-4 text-2xl font-bold text-neutral-900 md:text-3xl dark:text-neutral-100"
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      );
    }

    return <div className={cn('flex items-center justify-center', className)}>{emptyState}</div>;
  }

  const blurInactive = variant === 'panel' && !isBrowsing;
  const edgeFade = EDGE_FADE[variant];

  return (
    <div ref={containerRef} className={scrollClassName}>
      <div
        className={cn(
          'pointer-events-none sticky top-0 left-0 right-0 z-20 h-16 bg-gradient-to-b from-15% to-transparent',
          edgeFade,
        )}
      />

      <div className="py-[30vh]">
        {lyrics.timed.map((line, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={`${line.time}-${index}`}
              ref={isActive ? setActiveLineRef : undefined}
              onClick={() => onSeek(line.time)}
              className={cn(
                'cursor-pointer py-4 transition-[opacity,filter] duration-300',
                isActive ? 'opacity-100' : 'opacity-20',
                !isActive && blurInactive && 'blur-[1.4px]',
              )}
            >
              <p className="text-2xl font-bold text-neutral-900 md:text-3xl dark:text-neutral-100">{line.text}</p>
              {line.secondary && (
                <p
                  className={cn(
                    'mt-2 text-xl font-bold text-neutral-900 transition-opacity duration-300 md:text-2xl dark:text-neutral-100',
                    isActive && secondaryRevealed ? 'opacity-100' : 'opacity-20',
                  )}
                >
                  {line.secondary.text}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'pointer-events-none sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-15% to-transparent',
          edgeFade,
        )}
      />
    </div>
  );
}

/**
 * Memoised on purpose: the player re-renders on every `timeupdate`, while this
 * list should only re-render when the highlighted line actually changes.
 */
export default memo(LyricsView);
