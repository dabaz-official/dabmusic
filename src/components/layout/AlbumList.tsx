import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

import { ExplicitIcon, PlayIcon, PauseIcon } from '@/components/icon/PlayerIcon';
import { Album } from '@/lib/albums';
import { usePlayer } from '@/contexts/PlayerContext';

interface AlbumListProps {
  albums: Album[];
}

export default function AlbumList({ albums }: AlbumListProps) {
  const { setCurrentSongs, setCurrentSongIndex, setHasPlayed, playerRef, currentSongs, isPlaying, setIsShuffle, setIsPlaying } = usePlayer();

  const handlePlayAlbum = (album: Album) => {
    // 如果正在播放这个专辑，则暂停播放
    if (currentSongs === album.songs && isPlaying) {
      setIsPlaying(false);
      return;
    }

    // 随机选择专辑中的一首歌
    const randomIndex = Math.floor(Math.random() * album.songs.length);
    setCurrentSongs(album.songs);
    setCurrentSongIndex(randomIndex);
    setHasPlayed(true);
    // 激活随机播放模式
    setIsShuffle(true);
    setTimeout(() => {
      playerRef.current?.startPlay();
    }, 100);
  };

  return (
    <div className="mt-6 grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
      {albums.map((album, index) => (
        <motion.div
          key={index}
          className="group relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
        >
          <div className="relative">
            <Link href={`/album/${album.id}`} className="block">
              <Image
                src={album.cover}
                alt={album.title}
                height={400}
                width={400}
                className="aspect-square w-full rounded-xl bg-neutral-200 dark:bg-neutral-800 object-cover group-hover:opacity-90 transition-all duration-300 cursor-pointer"
              />
            </Link>
            {/* 播放按钮 */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePlayAlbum(album);
              }}
              className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-white/70 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:bg-white/80 dark:hover:bg-black/80 hover:scale-105 z-[5] cursor-pointer ${
                currentSongs === album.songs && isPlaying ? 'text-neutral-800 dark:text-neutral-100' : 'text-black dark:text-white'
              }`}
              aria-label={currentSongs === album.songs && isPlaying ? `Pause ${album.title}` : `Play ${album.title}`}
            >
              {currentSongs === album.songs && isPlaying ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4 ml-0.5" />
              )}
            </button>
          </div>
          <div className="mt-2 flex justify-between">
            <div>
              <h3 className="text-md font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-1">
                <Link href={`/album/${album.id}`}>
                  <span aria-hidden="true" className="absolute inset-0" />
                  {album.title}
                </Link>
                <span className="text-neutral-600 dark:text-neutral-400 text-sm">{album.isExplicit && <ExplicitIcon className="h-4 w-4" />}</span>
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{album.artist}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
