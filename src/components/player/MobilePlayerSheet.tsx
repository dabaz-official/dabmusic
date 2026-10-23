'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useDragControls } from 'motion/react';

import { CloseLyricsIcon, ExplicitIcon, OpenLyricsIcon } from '@/components/icon/PlayerIcon';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/utils';
import LyricsView from './LyricsView';
import ProgressBar from './ProgressBar';
import TransportControls from './TransportControls';
import type { PlayerViewProps } from './types';

interface MobilePlayerSheetProps extends PlayerViewProps {
  open: boolean;
  onClose: () => void;
}

// Module scope so the element identity stays stable and `LyricsView` can skip
// re-rendering on every playback tick.
const EMPTY_STATE = (
  <div className="text-center text-neutral-500 dark:text-neutral-400">
    <div className="mb-2 text-lg">暂无歌词</div>
    <div className="text-sm">享受纯音乐时光</div>
  </div>
);

export default function MobilePlayerSheet({ open, onClose, ...player }: MobilePlayerSheetProps) {
  const dragControls = useDragControls();
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            drag="y"
            // Dragging from anywhere would fight the lyric scroller, so only the
            // top strip starts a drag.
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="relative flex h-full w-full flex-col justify-center bg-neutral-100 pb-[env(safe-area-inset-bottom)] dark:bg-neutral-900"
          >
            <div
              onPointerDown={(event) => dragControls.start(event)}
              className="absolute inset-x-0 top-0 z-20 flex h-16 cursor-grab justify-center pt-[calc(0.5rem_+_env(safe-area-inset-top))] active:cursor-grabbing"
            >
              <div className="h-1 w-12 rounded-full bg-neutral-400 dark:bg-neutral-600" />
            </div>

            <div className={cn('flex h-full flex-col px-6', isLyricsOpen ? 'pb-0' : 'justify-center pb-6')}>
              {isLyricsOpen ? (
                <div className="absolute inset-0 pt-16 pb-32">
                  <LyricsView
                    variant="sheet"
                    className="h-full px-6"
                    lyrics={player.lyrics}
                    activeIndex={player.activeIndex}
                    secondaryRevealed={player.secondaryRevealed}
                    onSeek={player.onSeek}
                    emptyState={EMPTY_STATE}
                  />
                </div>
              ) : (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-6 flex justify-center"
                  >
                    <div className="aspect-square w-full">
                      <Image
                        src={song.cover}
                        alt={song.title}
                        width={400}
                        height={400}
                        className="h-full w-full rounded-2xl object-cover shadow-2xl"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mb-6 text-center"
                  >
                    <div className="mb-2 flex items-center justify-center gap-2 text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {song.title}
                      {song.isExplicit && (
                        <ExplicitIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </div>
                    <div className="text-neutral-600 dark:text-neutral-400">{song.artist}</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="mb-6"
                  >
                    <ProgressBar
                      layout="stacked"
                      progress={player.progress}
                      currentTime={player.currentTime}
                      duration={player.duration}
                      onSeekProgress={player.onSeekProgress}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <TransportControls
                      size="sheet"
                      className="flex items-center justify-center space-x-8"
                      isPlaying={player.isPlaying}
                      isShuffle={player.isShuffle}
                      isLoop={player.isLoop}
                      onTogglePlay={player.onTogglePlay}
                      onNext={player.onNext}
                      onPrevious={player.onPrevious}
                      onToggleShuffle={player.onToggleShuffle}
                      onToggleLoop={player.onToggleLoop}
                    />
                  </motion.div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => player.hasLyrics && player.onToggleLyrics()}
              disabled={!player.hasLyrics}
              aria-label={isLyricsOpen ? 'Hide lyrics' : 'Show lyrics'}
              className={cn(
                'fixed right-6 bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] z-20 cursor-pointer rounded-full p-3 transition-colors duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-800',
                player.hasLyrics ? 'opacity-100' : 'cursor-not-allowed opacity-40',
              )}
            >
              {isLyricsOpen ? (
                <CloseLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
              ) : (
                <OpenLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
