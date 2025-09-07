'use client';

import Image from 'next/image';
import { use, useMemo, useState, useEffect } from 'react';
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
  const { setCurrentSongs, setCurrentSongIndex, setHasPlayed, playerRef, currentSongs, currentSongIndex, isPlaying } = usePlayer();
  const [totalDuration, setTotalDuration] = useState<number>(0);
  
  // 计算专辑总时长（始终在顶层调用）
  useEffect(() => {
    const calculateTotalDuration = async () => {
      if (!album) return; // 条件移到 Hook 内部
      let total = 0;
      const promises = album.songs.map((song) => {
        return new Promise<number>((resolve) => {
          const audio = new Audio(song.src);
          audio.addEventListener('loadedmetadata', () => {
            resolve(audio.duration || 0);
          });
          audio.addEventListener('error', () => {
            resolve(0);
          });
        });
      });
      
      const durations = await Promise.all(promises);
      total = durations.reduce((sum, duration) => sum + duration, 0);
      setTotalDuration(total);
    };

    calculateTotalDuration();
  }, [album]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  // 所有 Hooks 调用后，处理条件渲染
  if (!album) return notFound();

  return (
    <div className="container mx-auto px-6 py-6">
      <div className="mb-6">
        <button onClick={() => history.back()} className="text-sm text-neutral-900 hover:opacity-80 duration-200 cursor-pointer">← Back</button>
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
              {/* 注意：album.isExplicit 未定义，建议移除或在 Album 接口添加字段 */}
              {/* {album.isExplicit && <ExplicitIcon className="h-5 w-5 text-neutral-500" />} */}
            </h1>
            <p className="text-neutral-500 mt-1">{album.artist}</p>
            <p className="text-neutral-500 text-sm mt-1">
              {album.songs.length} Songs · {totalDuration > 0 ? formatDuration(totalDuration) : 'Loading...'}
            </p>
            {album.releaseDate && <p className="text-neutral-500 text-sm mt-1">{album.releaseDate}</p>}
          </div>
        </motion.div>

        {/* Right side: Songs list (wider on PC, full width on mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.35, 
            ease: 'easeOut', 
            delay: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 0 : 0.2 
          }}
          className="flex-1 min-w-0"
        >
          <div className="divide-y divide-neutral-200">
            {album.songs.map((song) => (
              <div key={song.title} className="px-2 sm:px-4 py-2 sm:py-3"> {/* 假设 Song 无 id，用 title 作为 key */}
                <button 
                  className="flex items-center gap-2 sm:gap-4 w-full text-left rounded-lg p-1 sm:p-2 -m-1 sm:-m-2 transition-colors cursor-pointer" 
                  onClick={() => {
                    const idx = album.songs.findIndex(s => s.title === song.title); // 假设无 id，用 title 查找
                    if (idx >= 0) {
                      setCurrentSongs(album.songs);
                      setCurrentSongIndex(idx);
                      setHasPlayed(true);
                      setTimeout(() => playerRef.current?.startPlay(), 50);
                    }
                  }}
                >
                  <span className="w-4 sm:w-6 shrink-0 text-neutral-500 tabular-nums text-center text-sm">
                    {currentSongs === album.songs && currentSongIndex === album.songs.findIndex(s => s.title === song.title) ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <motion.div 
                          className="w-1 bg-red-500 rounded-full"
                          animate={isPlaying ? { height: ['12px', '20px', '12px'] } : { height: '12px' }}
                          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut" }}
                        />
                        <motion.div 
                          className="w-1 bg-red-500 rounded-full"
                          animate={isPlaying ? { height: ['16px', '24px', '16px'] } : { height: '16px' }}
                          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut", delay: 0.1 }}
                        />
                        <motion.div 
                          className="w-1 bg-red-500 rounded-full"
                          animate={isPlaying ? { height: ['8px', '16px', '8px'] } : { height: '8px' }}
                          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut", delay: 0.2 }}
                        />
                        <motion.div 
                          className="w-1 bg-red-500 rounded-full"
                          animate={isPlaying ? { height: ['12px', '20px', '12px'] } : { height: '12px' }}
                          transition={{ duration: 0.8, repeat: isPlaying ? Infinity : 0, ease: "easeInOut", delay: 0.3 }}
                        />
                      </div>
                    ) : (
                      song.title.substring(0, 3) // 假设用标题前3字符作为序号
                    )}
                  </span>
                  <div className="flex-1 min-w-32">
                    <div className="text-neutral-900 truncate flex items-center gap-1 sm:gap-1.5 font-medium text-sm sm:text-base">
                      {currentSongs === album.songs && currentSongIndex === album.songs.findIndex(s => s.title === song.title) ? (
                        <div className="text-red-500">
                          {song.title}
                        </div>
                      ) : (
                        song.title
                      )}
                      {song.isExplicit && <ExplicitIcon className="h-3 w-3 text-neutral-500 mb-0.5 sm:mb-0" />}
                    </div>
                    <div className="text-neutral-500 text-xs sm:text-sm truncate">{song.artist}</div> 
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