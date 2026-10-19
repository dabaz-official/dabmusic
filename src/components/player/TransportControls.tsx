'use client';

import {
  NextSongIcon,
  PauseIcon,
  PlayIcon,
  PrevSongIcon,
  Repeat1Icon,
  RepeatIcon,
  ShuffleIcon,
} from '@/components/icon/PlayerIcon';
import { cn } from '@/lib/utils';

/**
 * `bar` is the compact bottom bar, `modal` the desktop overlay, `sheet` the
 * mobile overlay. Each keeps the icon sizes of its surface.
 */
export type ControlSize = 'bar' | 'modal' | 'sheet';

/** `full` = shuffle/prev/play/next/loop, or just one of the two clusters. */
export type ControlLayout = 'full' | 'transport' | 'modes';

interface SizeStyles {
  button: string;
  side: string;
  toggle: string;
  playButton: string;
  play: string;
  playNudge: string;
  pauseNudge: string;
  filledPlay: boolean;
  transportHover: string;
}

const SIZES: Record<ControlSize, SizeStyles> = {
  bar: {
    button: 'p-2',
    side: 'h-3 w-auto',
    toggle: 'h-4 w-auto',
    playButton: 'p-2',
    play: 'h-4 w-auto',
    playNudge: 'pl-0.5',
    pauseNudge: 'pr-0.5',
    filledPlay: false,
    transportHover: 'hover:opacity-80',
  },
  modal: {
    button: 'p-3',
    side: 'h-5 w-5',
    toggle: 'h-4 w-4',
    playButton:
      'p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200',
    play: 'h-4 w-4',
    playNudge: 'ml-0.5 -mr-0.5',
    pauseNudge: '',
    filledPlay: true,
    transportHover: '',
  },
  sheet: {
    button: 'p-3',
    side: 'h-6 w-6',
    toggle: 'h-6 w-6',
    playButton:
      'p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200',
    play: 'h-8 w-8',
    playNudge: 'ml-1 -mr-1',
    pauseNudge: '',
    filledPlay: true,
    transportHover: '',
  },
};

const SIDE_ICON = 'text-neutral-900 dark:text-neutral-100';
const FILLED_ICON = 'text-neutral-100 dark:text-neutral-900';

interface TransportControlsProps {
  size: ControlSize;
  layout?: ControlLayout;
  isPlaying: boolean;
  isShuffle: boolean;
  isLoop: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleLoop: () => void;
  className?: string;
}

export default function TransportControls({
  size,
  layout = 'full',
  isPlaying,
  isShuffle,
  isLoop,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleLoop,
  className,
}: TransportControlsProps) {
  const styles = SIZES[size];
  const button = cn(styles.button, 'flex items-center justify-center cursor-pointer');

  const shuffle = (
    <button
      type="button"
      onClick={onToggleShuffle}
      className={cn(button, 'transition-opacity duration-200', isShuffle ? 'opacity-100' : 'opacity-60', 'hover:opacity-100')}
      aria-label={isShuffle ? 'Turn shuffle off' : 'Turn shuffle on'}
      aria-pressed={isShuffle}
    >
      <ShuffleIcon className={cn(styles.toggle, SIDE_ICON)} />
    </button>
  );

  const loop = (
    <button
      type="button"
      onClick={onToggleLoop}
      className={cn(button, 'transition-opacity duration-200', styles.transportHover)}
      aria-label={isLoop ? 'Turn repeat off' : 'Repeat this song'}
      aria-pressed={isLoop}
    >
      {isLoop ? (
        <Repeat1Icon className={cn(styles.toggle, SIDE_ICON)} />
      ) : (
        <RepeatIcon className={cn(styles.toggle, SIDE_ICON)} />
      )}
    </button>
  );

  const transport = (
    <>
      <button
        type="button"
        onClick={onPrevious}
        className={cn(button, 'transition-opacity duration-200', styles.transportHover)}
        aria-label="Previous song"
      >
        <PrevSongIcon className={cn(styles.side, SIDE_ICON)} />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        className={cn(button, styles.playButton, 'transition-colors cursor-pointer')}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <PauseIcon
            className={cn(styles.play, styles.pauseNudge, styles.filledPlay ? FILLED_ICON : SIDE_ICON)}
          />
        ) : (
          <PlayIcon className={cn(styles.play, styles.playNudge, styles.filledPlay ? FILLED_ICON : SIDE_ICON)} />
        )}
      </button>

      <button
        type="button"
        onClick={onNext}
        className={cn(button, 'transition-opacity duration-200', styles.transportHover)}
        aria-label="Next song"
      >
        <NextSongIcon className={cn(styles.side, SIDE_ICON)} />
      </button>
    </>
  );

  if (layout === 'transport') return <div className={className}>{transport}</div>;
  if (layout === 'modes') {
    return (
      <div className={className}>
        {loop}
        {shuffle}
      </div>
    );
  }

  return (
    <div className={className}>
      {shuffle}
      {transport}
      {loop}
    </div>
  );
}
