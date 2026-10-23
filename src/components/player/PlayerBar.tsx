'use client';

import Image from 'next/image';

import { ExplicitIcon } from '@/components/icon/PlayerIcon';
import ProgressBar from './ProgressBar';
import TransportControls from './TransportControls';
import VolumeControl from './VolumeControl';
import type { PlayerViewProps } from './types';

interface PlayerBarProps extends PlayerViewProps {
  onOpen: () => void;
}

export default function PlayerBar({ onOpen, ...player }: PlayerBarProps) {
  const { song, isPlaying } = player;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Anything interactive keeps its own click; the rest of the bar opens the
    // full-screen player.
    const target = event.target as HTMLElement;
    if (target.closest('button, a, [data-slot="slider"], [data-player-popover]')) return;
    onOpen();
  };

  return (
    <div
      onClick={handleClick}
      className="fixed bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] left-6 right-6 z-30 mx-auto w-auto max-w-[64rem] cursor-pointer items-center rounded-full border border-neutral-200 bg-neutral-100 py-2 pl-1 pr-4 shadow-md md:bottom-[calc(2rem_+_env(safe-area-inset-bottom))] dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex h-8 items-center space-x-4">
        <div className="relative flex items-center space-x-3">
          <Image
            src={song.cover}
            alt={song.title}
            width={40}
            height={40}
            className={`rounded-full object-cover ${isPlaying ? 'sm:animate-spin' : ''}`}
            style={{
              animationDuration: '10s',
              animationTimingFunction: 'linear',
              animationIterationCount: isPlaying ? 'infinite' : '0',
            }}
          />
          <div className="relative w-32 min-w-0 overflow-hidden sm:w-24 md:w-32 lg:w-44">
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center overflow-hidden text-sm font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                {song.title}
                {song.isExplicit && (
                  <ExplicitIcon className="ml-1 h-3 w-3 text-neutral-600 dark:text-neutral-400" />
                )}
              </div>
              <div className="overflow-hidden text-xs whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                {song.artist}
              </div>
            </div>
            <div className="pointer-events-none absolute top-0 right-0 flex h-full w-8 bg-gradient-to-l from-neutral-100 to-transparent dark:from-neutral-900" />
          </div>
        </div>

        <TransportControls
          size="bar"
          layout="transport"
          className="fixed right-4 flex items-center space-x-3 sm:relative sm:right-0"
          isPlaying={player.isPlaying}
          isShuffle={player.isShuffle}
          isLoop={player.isLoop}
          onTogglePlay={player.onTogglePlay}
          onNext={player.onNext}
          onPrevious={player.onPrevious}
          onToggleShuffle={player.onToggleShuffle}
          onToggleLoop={player.onToggleLoop}
        />

        <ProgressBar
          layout="bar"
          className="hidden flex-1 sm:flex"
          progress={player.progress}
          currentTime={player.currentTime}
          duration={player.duration}
          onSeekProgress={player.onSeekProgress}
        />

        <TransportControls
          size="bar"
          layout="modes"
          className="hidden items-center space-x-3 sm:flex"
          isPlaying={player.isPlaying}
          isShuffle={player.isShuffle}
          isLoop={player.isLoop}
          onTogglePlay={player.onTogglePlay}
          onNext={player.onNext}
          onPrevious={player.onPrevious}
          onToggleShuffle={player.onToggleShuffle}
          onToggleLoop={player.onToggleLoop}
        />

        <div className="hidden items-center md:flex">
          <VolumeControl
            variant="popover"
            volume={player.volume}
            muted={player.muted}
            onVolumeChange={player.onVolumeChange}
            onToggleMute={player.onToggleMute}
          />
        </div>
      </div>
    </div>
  );
}
