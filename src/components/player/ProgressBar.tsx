'use client';

import { useState } from 'react';

import { Slider } from '@/components/ui/slider';
import { formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** Playback position as a percentage, 0-100. */
  progress: number;
  currentTime: number;
  duration: number;
  onSeekProgress: (percent: number) => void;
  /** `bar` puts the clock beside the track, `stacked` puts it underneath. */
  layout: 'bar' | 'stacked';
  className?: string;
}

export default function ProgressBar({
  progress,
  currentTime,
  duration,
  onSeekProgress,
  layout,
  className,
}: ProgressBarProps) {
  // While dragging, the thumb follows the pointer rather than the audio clock.
  const [scrub, setScrub] = useState<number | null>(null);
  const displayedProgress = scrub ?? progress;
  const displayedTime = scrub === null ? currentTime : (scrub / 100) * duration;

  const slider = (
    <Slider
      value={[displayedProgress]}
      max={100}
      step={0.1}
      aria-label="Seek"
      onValueChange={(values) => {
        const next = values[0];
        if (next === undefined) return;
        setScrub(next);
        onSeekProgress(next);
      }}
      onValueCommit={() => setScrub(null)}
      className="w-full cursor-pointer rounded-full"
    />
  );

  if (layout === 'stacked') {
    return (
      <div className={className}>
        {slider}
        <div className="mt-2 flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
          <span className="tabular-nums">{formatTime(displayedTime)}</span>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {slider}
      <p className="min-w-[80px] text-sm text-neutral-900 dark:text-neutral-100">
        <span className="inline-block w-[2rem] text-right tabular-nums">{formatTime(displayedTime)}</span>
        <span className="inline-block w-[1rem] text-center opacity-50">/</span>
        <span className="inline-block w-[2rem] text-left tabular-nums">{formatTime(duration)}</span>
      </p>
    </div>
  );
}
