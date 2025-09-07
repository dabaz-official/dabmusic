'use client';

import Image from 'next/image';
import Link from 'next/link';
import { use, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'motion/react';

import { albums } from '@/lib/albums';
import { ExplicitIcon } from '@/components/icon/PlayerIcon';
import { usePlayer } from '@/contexts/PlayerContext';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AlbumPage({ params }: PageProps) {
  const { id } = use(params);
  const album = useMemo(() => albums.find(a => a.id === id), [id]);
  if (!album) return notFound();

  const { setCurrentSongs, setCurrentSongIndex, setHasPlayed, playerRef, currentSongs, currentSongIndex } = usePlayer();

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="mb-6">
        <button onClick={() => history.back()} className="text-sm text-neutral-900 hover:opacity-80 duration-200">← Back</button>
      </div>

      {/* PC: Two-column layout, Mobile: Stacked layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side: Album cover and info (narrower on PC, centered on mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex flex-col items-center lg:items-start lg:w-96 lg:flex-shrink-0"
        >
          <Image src={album.cover} alt={album.title} width={400} height={400} className="rounded-xl object-cover mb-4 bg-neutral-200 w-64 h-64 lg:w-96 lg:h-96" />
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center justify-center lg:justify-start gap-2">
              {album.title}
              {album.isExplicit && <ExplicitIcon className="h-5 w-5 text-neutral-500" />}
            </h1>
            <p className="text-neutral-500 mt-1">{album.artist}</p>
            {album.releaseDate && <p className="text-neutral-500 text-sm mt-1">{album.releaseDate}</p>}
          </div>
        </motion.div>

        {/* Right side: Songs list (wider on PC, full width on mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.45 }}
          className="flex-1 min-w-0"
        >
          <div className="divide-y divide-neutral-200">
            {album.songs.map((song) => (
              <div key={song.id} className=" md:px-4 py-3">
                <button 
                  className="flex items-center gap-4 w-full text-left rounded-lg p-2 -m-2 transition-colors cursor-pointer" 
                  onClick={() => {
                    const idx = album.songs.findIndex(s => s.id === song.id);
                    if (idx >= 0) {
                      setCurrentSongs(album.songs);
                      setCurrentSongIndex(idx);
                      setHasPlayed(true);
                      setTimeout(() => playerRef.current?.startPlay(), 50);
                    }
                  }}
                >
                  <span className="w-8 shrink-0 text-neutral-500 tabular-nums text-right">{song.id}</span>
                  <div className="flex-1 min-w-96">
                    <div className="text-neutral-900 truncate flex items-center gap-1">
                      {song.title}
                      {song.isExplicit && <ExplicitIcon className="h-4 w-4 text-neutral-500" />}
                      {currentSongs === album.songs && currentSongIndex === album.songs.findIndex(s => s.id === song.id) && (
                        <span className="text-red-500 text-sm font-medium ml-1">Playing</span>
                      )}
                    </div>
                    <div className="text-neutral-500 text-sm truncate">{song.artist}</div> 
                  </div>
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

    </div>
  );
}


