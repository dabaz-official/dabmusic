'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

import { ExplicitIcon } from '@/components/icon/PlayerIcon';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTotalDuration } from '@/hooks/useTotalDuration';
import type { Album } from '@/lib/albums';
import { formatDuration } from '@/lib/format';

interface AlbumClientProps {
  album: Album;
}

/** Four bars that bounce while the track plays, matching the album's red accent. */
const BAR_ANIMATIONS = [
  { rest: '0.4rem', active: ['0.3rem', '0.4rem', '0.3rem'], delay: 0 },
  { rest: '0.8rem', active: ['0.4rem', '0.8rem', '0.4rem'], delay: 0.1 },
  { rest: '0.6rem', active: ['0.3rem', '0.6rem', '0.3rem'], delay: 0.3 },
  { rest: '0.4rem', active: ['0.2rem', '0.4rem', '0.2rem'], delay: 0.2 },
];

function PlayingIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {BAR_ANIMATIONS.map((bar, index) => (
        <motion.div
          key={index}
          className="w-1 rounded-full bg-red-500"
          animate={isPlaying ? { height: bar.active } : { height: bar.rest }}
          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: 'easeInOut', delay: bar.delay }}
        />
      ))}
    </div>
  );
}

export default function AlbumClient({ album }: AlbumClientProps) {
  const { queueId, index: currentIndex, isPlaying, playQueue } = usePlayer();
  const totalDuration = useTotalDuration(album.songs);
  const isCurrentAlbum = queueId === album.id;

  return (
    <div className="container mx-auto px-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => history.back()}
          className="text-md cursor-pointer text-neutral-600 duration-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back
        </button>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex flex-col items-center lg:w-96 lg:flex-shrink-0 lg:items-start"
        >
          <Image
            src={album.cover}
            alt={album.title}
            width={400}
            height={400}
            preload
            className="mb-4 h-64 w-64 rounded-xl bg-neutral-200 object-cover lg:h-96 lg:w-96 dark:bg-neutral-800"
          />
          <div className="text-center lg:text-left">
            <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold text-neutral-900 lg:justify-start dark:text-neutral-100">
              {album.title}
              {album.isExplicit && <ExplicitIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">{album.artist}</p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {album.songs.length} Songs · {totalDuration === null ? 'Loading...' : formatDuration(totalDuration)}
            </p>
            {album.releaseDate && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{album.releaseDate}</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
          className="min-w-0 flex-1"
        >
          <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
            {album.songs.map((song, songIndex) => {
              const isCurrentSong = isCurrentAlbum && currentIndex === songIndex;

              return (
                <div key={song.id} className="px-2 py-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => playQueue(album.songs, songIndex, { id: album.id })}
                    className="-m-1 flex w-full cursor-pointer items-center gap-2 rounded-lg p-1 text-left transition-colors sm:-m-2 sm:gap-4 sm:p-2"
                  >
                    <span className="w-4 shrink-0 text-center text-sm tabular-nums text-neutral-600 sm:w-6 dark:text-neutral-400">
                      {isCurrentSong ? <PlayingIndicator isPlaying={isPlaying} /> : song.id}
                    </span>
                    <div className="min-w-32 flex-1">
                      <div
                        className={`flex items-center gap-1 text-sm font-medium sm:gap-1.5 sm:text-base ${
                          isCurrentSong ? 'text-red-500' : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        <span className="truncate">{song.title}</span>
                        {song.isExplicit && (
                          <ExplicitIcon className="h-3 w-3 text-neutral-600 dark:text-neutral-400" />
                        )}
                      </div>
                      <div className="truncate text-xs text-neutral-600 sm:text-sm dark:text-neutral-400">
                        {song.artist && song.artist.trim().toLowerCase() !== album.artist.trim().toLowerCase()
                          ? song.artist
                          : null}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
