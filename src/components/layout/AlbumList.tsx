'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ExplicitIcon, PauseIcon, PlayIcon } from '@/components/icon/PlayerIcon';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Album } from '@/lib/albums';

interface AlbumListProps {
  albums: Album[];
}

export default function AlbumList({ albums }: AlbumListProps) {
  const { queueId, isPlaying, playQueue, setPlaying } = usePlayer();

  const handlePlay = (album: Album) => {
    if (queueId === album.id && isPlaying) {
      setPlaying(false);
      return;
    }
    playQueue(album.songs, Math.floor(Math.random() * album.songs.length), {
      id: album.id,
      shuffle: true,
    });
  };

  return (
    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
      {albums.map((album) => {
        const isCurrent = queueId === album.id;
        const isPlayingAlbum = isCurrent && isPlaying;

        return (
          <div key={album.id} className="group relative">
            <div className="relative">
              <Link href={`/album/${album.id}`} className="block">
                <Image
                  src={album.cover}
                  alt={album.title}
                  height={400}
                  width={400}
                  className="aspect-square w-full cursor-pointer rounded-xl bg-neutral-200 object-cover transition-all duration-300 group-hover:opacity-90 dark:bg-neutral-800"
                />
              </Link>

              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handlePlay(album);
                }}
                aria-label={isPlayingAlbum ? `Pause ${album.title}` : `Play ${album.title}`}
                className={`absolute right-2 bottom-2 z-[5] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/70 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/80 dark:bg-black/70 dark:hover:bg-black/80 ${
                  isPlayingAlbum ? 'text-neutral-800 dark:text-neutral-100' : 'text-black dark:text-white'
                }`}
              >
                {isPlayingAlbum ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="ml-0.5 h-4 w-4" />}
              </button>
            </div>

            <div className="mt-2 flex justify-between">
              <div>
                <h3 className="text-md flex items-center space-x-1 font-semibold text-neutral-900 dark:text-neutral-100">
                  <Link href={`/album/${album.id}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {album.title}
                  </Link>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {album.isExplicit && <ExplicitIcon className="h-4 w-4" />}
                  </span>
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{album.artist}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
