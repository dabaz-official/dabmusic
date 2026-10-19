'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

import { CloseIcon, CloseLyricsIcon, ExplicitIcon, OpenLyricsIcon } from '@/components/icon/PlayerIcon';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/utils';
import LyricsView from './LyricsView';
import ProgressBar from './ProgressBar';
import TransportControls from './TransportControls';
import VolumeControl from './VolumeControl';
import type { PlayerViewProps } from './types';

interface DesktopPlayerModalProps extends PlayerViewProps {
  open: boolean;
  onClose: () => void;
}

// Module scope so the element identity stays stable and `LyricsView` can skip
// re-rendering on every playback tick.
const EMPTY_STATE = (
  <div className="text-center text-3xl font-bold text-neutral-900 md:text-4xl dark:text-neutral-100">
    #Instrumental
  </div>
);

export default function DesktopPlayerModal({ open, onClose, ...player }: DesktopPlayerModalProps) {
  useScrollLock(open);

  const { song, isLyricsOpen } = player;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="relative h-full w-full overflow-auto bg-white p-8 dark:bg-black"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close player"
              className="absolute top-4 right-4 z-[70] cursor-pointer rounded-full p-2 transition-colors duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <CloseIcon className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
            </button>

            <div
              className={cn(
                'relative mx-auto h-full max-w-6xl',
                isLyricsOpen ? 'md:flex md:flex-row md:items-center md:gap-10' : 'flex flex-col items-center justify-center gap-8',
              )}
            >
              <div
                className={cn(
                  'flex w-full flex-col items-center gap-6',
                  isLyricsOpen && 'md:w-1/2',
                )}
              >
                <div className="w-full max-w-md">
                  <Image
                    src={song.cover}
                    alt={song.title}
                    width={384}
                    height={384}
                    priority
                    className="h-auto w-full rounded-2xl object-cover"
                  />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {song.title}
                    {song.isExplicit && (
                      <ExplicitIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                    )}
                  </div>
                  <div className="text-lg text-neutral-600 dark:text-neutral-400">{song.artist}</div>
                </div>

                <ProgressBar
                  layout="stacked"
                  className="w-full max-w-md"
                  progress={player.progress}
                  currentTime={player.currentTime}
                  duration={player.duration}
                  onSeekProgress={player.onSeekProgress}
                />

                <TransportControls
                  size="modal"
                  className="-mt-2 flex w-full items-center justify-center space-x-4"
                  isPlaying={player.isPlaying}
                  isShuffle={player.isShuffle}
                  isLoop={player.isLoop}
                  onTogglePlay={player.onTogglePlay}
                  onNext={player.onNext}
                  onPrevious={player.onPrevious}
                  onToggleShuffle={player.onToggleShuffle}
                  onToggleLoop={player.onToggleLoop}
                />

                <div className="flex w-full max-w-md items-center justify-center">
                  <VolumeControl
                    variant="inline"
                    volume={player.volume}
                    muted={player.muted}
                    onVolumeChange={player.onVolumeChange}
                    onToggleMute={player.onToggleMute}
                  />
                </div>
              </div>

              {isLyricsOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 flex w-full items-center justify-center md:mt-0 md:w-1/2"
                >
                  <LyricsView
                    variant="panel"
                    className="h-[calc(100vh-8rem)] w-full px-4"
                    lyrics={player.lyrics}
                    activeIndex={player.activeIndex}
                    secondaryRevealed={player.secondaryRevealed}
                    onSeek={player.onSeek}
                    emptyState={EMPTY_STATE}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="fixed right-6 bottom-6 z-[60]"
              >
                <button
                  type="button"
                  onClick={() => player.hasLyrics && player.onToggleLyrics()}
                  disabled={!player.hasLyrics}
                  aria-label={isLyricsOpen ? 'Hide lyrics' : 'Show lyrics'}
                  className={cn(
                    'flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition dark:bg-black/40',
                    player.hasLyrics
                      ? 'opacity-100 hover:bg-white/90 dark:hover:bg-black/60'
                      : 'cursor-not-allowed opacity-40',
                  )}
                >
                  {isLyricsOpen ? (
                    <CloseLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                  ) : (
                    <OpenLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
