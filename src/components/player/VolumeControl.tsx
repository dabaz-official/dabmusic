'use client';

import { useState } from 'react';

import { MuteIcon, VolumeIcon } from '@/components/icon/PlayerIcon';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  /** 0-1. */
  volume: number;
  muted: boolean;
  onVolumeChange: (percent: number) => void;
  onToggleMute: () => void;
  /** `popover` reveals a vertical slider on hover (bottom bar), `inline` shows it in place. */
  variant: 'popover' | 'inline';
}

export default function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  variant,
}: VolumeControlProps) {
  const [scrub, setScrub] = useState<number | null>(null);
  const percent = scrub ?? Math.round(volume * 100);
  const isSilent = muted || volume === 0;
  const iconClass = variant === 'popover' ? 'h-4 w-4' : 'h-3 w-3';

  const handleChange = (values: number[]) => {
    const next = values[0];
    if (next === undefined) return;
    setScrub(next);
    onVolumeChange(next);
  };

  const muteButton = (
    <button
      type="button"
      onClick={onToggleMute}
      className="flex cursor-pointer items-center justify-center p-2 text-neutral-900 transition-opacity duration-200 hover:opacity-80 dark:text-neutral-100"
      aria-label={isSilent ? 'Unmute' : 'Mute'}
      aria-pressed={isSilent}
    >
      {isSilent ? <MuteIcon className={iconClass} /> : <VolumeIcon className={iconClass} />}
    </button>
  );

  if (variant === 'inline') {
    return (
      // `w-full` matters: without it this row shrink-wraps to the mute button
      // and the slider's own `w-full` resolves against nothing.
      <div className="flex w-full items-center">
        {muteButton}
        <Slider
          value={[percent]}
          max={100}
          step={1}
          aria-label="Volume"
          onValueChange={handleChange}
          onValueCommit={() => setScrub(null)}
          className="flex-1 cursor-pointer rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="group relative">
      {muteButton}
      <div
        data-player-popover
        className={cn(
          'absolute bottom-0 left-1/2 z-20 mb-2 -translate-x-1/2 opacity-0 transition duration-200',
          // Hidden means untouchable too, otherwise the pill swallows clicks on the bar.
          'pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100',
          'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
        )}
      >
        <div className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-900 dark:shadow-lg">
          <div className="flex h-40 items-start justify-center px-2 pt-2">
            <Slider
              value={[percent]}
              max={100}
              step={1}
              orientation="vertical"
              aria-label="Volume"
              onValueChange={handleChange}
              onValueCommit={() => setScrub(null)}
              className="h-28 w-4 cursor-pointer rounded-full bg-neutral-300 dark:bg-neutral-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
