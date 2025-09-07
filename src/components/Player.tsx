import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

import { Song, albums } from '@/lib/albums';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon } from '@/components/icon/PlayerIcon';

interface PlayerProps {
  songs: Song[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean | ((prev: boolean) => boolean)) => void;
}

const Player = forwardRef<{ startPlay: () => void }, PlayerProps>(({ songs, currentIndex, setCurrentIndex, isPlaying, setIsPlaying, isShuffle, setIsShuffle }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 音量 0-1
  const [muted, setMuted] = useState(false);
  const prevVolumeRef = useRef(1);
  const [isSingleLoop, setIsSingleLoop] = useState(false);
  const [isMobilePlayerOpen, setIsMobilePlayerOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    startPlay: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch((e) => console.error('播放失败:', e));
        setIsPlaying(true);
      }
    }
  }));

  // 当歌曲索引改变时，加载新歌曲
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = songs[currentIndex].src;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
      };
    }
  }, [currentIndex, songs, setCurrentIndex]);

  // 根据播放模式绑定结束后的行为（不修改 audio.src）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.onended = () => {
      if (isSingleLoop) {
        audio.currentTime = 0;
        setIsPlaying(true);
        audio.play().catch(() => {});
        return;
      }

      if (isShuffle) {
        if (songs.length <= 1) {
          setIsPlaying(false);
          return;
        }
        let nextIndex = currentIndex;
        while (nextIndex === currentIndex) {
          nextIndex = Math.floor(Math.random() * songs.length);
        }
        setCurrentIndex(nextIndex);
        setIsPlaying(true);
        return;
      }

      const nextIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
    };
  }, [isSingleLoop, isShuffle, currentIndex, songs, setCurrentIndex, setIsPlaying]);

  // 当播放状态改变时，控制播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      if (isPlaying) {
        audio.play().catch((e) => console.error('Failed to play:', e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentIndex]);

  // Listen album page play events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { albumId: string; songId: number } | undefined;
      if (!detail) return;
      const album = albums.find(a => a.id === detail.albumId);
      if (!album) return;
      const songIndex = album.songs.findIndex(s => s.id === detail.songId);
      if (songIndex === -1) return;
      setCurrentIndex(songIndex);
      setIsPlaying(true);
    };
    window.addEventListener('player:play', handler as EventListener);
    return () => window.removeEventListener('player:play', handler as EventListener);
  }, [setCurrentIndex, setIsPlaying]);

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Keyboard shortcut: Space toggles play/pause (ignores inputs and editable fields)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isTyping =
          (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') ||
          !!target?.isContentEditable;
        if (isTyping) return;
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const prevSong = () => {
    let newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    if (isShuffle && songs.length > 1) {
      do {
        newIndex = Math.floor(Math.random() * songs.length);
      } while (newIndex === currentIndex);
    }
    setCurrentIndex(newIndex);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };
  
  const nextSong = () => {
    let newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    if (isShuffle && songs.length > 1) {
      do {
        newIndex = Math.floor(Math.random() * songs.length);
      } while (newIndex === currentIndex);
    }
    setCurrentIndex(newIndex);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  const toggleLoopMode = () => {
    setIsSingleLoop((prev) => !prev);
  };

  const toggleShuffleMode = () => {
    setIsShuffle((prev) => !prev);
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = (value[0] / 100) * audio.duration;
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      const newVol = value[0] / 100;
      audio.volume = newVol;
      setVolume(newVol);
      if (newVol === 0) {
        setMuted(true);
      } else {
        setMuted(false);
        prevVolumeRef.current = newVol;
      }
    }
  };

  const toggleMuted = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (muted || volume === 0) {
      // unmute
      const restore = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5;
      audio.muted = false;
      audio.volume = restore;
      setVolume(restore);
      setMuted(false);
    } else {
      // mute
      prevVolumeRef.current = volume;
      audio.muted = true;
      setMuted(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayerClick = (e: React.MouseEvent) => {
    // 检查点击的是否是控制按钮
    const target = e.target as HTMLElement;
    const isControlButton = target.closest('button');
    
    // 如果不是控制按钮，则打开移动端弹窗
    if (!isControlButton) {
      setIsMobilePlayerOpen(true);
    }
  };

  return (
    <>
      <div 
        className="fixed bottom-6 md:bottom-8 left-6 right-6 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 py-2 pl-1 pr-4 shadow-md rounded-full items-center mx-auto w-auto max-w-[64rem] cursor-pointer"
        onClick={handlePlayerClick}
      >
        <audio ref={audioRef} />
        <div className="flex items-center space-x-4 h-8">
        <div className="relative flex items-center space-x-3">
          <div className="relative">
            {/* mobile play/pause overlay */}
            <button
              onClick={togglePlay}
              className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full text-neutral-900 dark:text-neutral-100 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm active:bg-neutral-800/60 active:scale-95 transition"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon className="h-4 w-4 mx-auto" /> : <PlayIcon className="h-4 w-4 mx-auto pl-0.5" />}
            </button>
            <Image
              src={songs[currentIndex].cover}
              alt={songs[currentIndex].title}
              width={40}
              height={40}
              className={`rounded-full object-cover ${isPlaying ? 'sm:animate-spin' : ''}`}
              style={{
                animationDuration: '10s',
                animationTimingFunction: 'linear',
                animationIterationCount: isPlaying ? 'infinite' : '0'
              }}
            />
          </div>
          <div className="relative w-32 sm:w-24 md:w-32 lg:w-44 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap overflow-hidden flex items-center">
                {songs[currentIndex].title}
                {songs[currentIndex].isExplicit && <ExplicitIcon className="h-3 w-3 text-neutral-600 dark:text-neutral-400 ml-1" />}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap overflow-hidden">
                {songs[currentIndex].artist}
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-neutral-100 dark:from-neutral-800 to-transparent flex" />
          </div>
        </div>
        <div className="fixed sm:relative items-center space-x-3 right-4 sm:right-0 flex">
          <button onClick={prevSong} className="flex items-center justify-center p-2">
            <PrevSongIcon className="h-3 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
          </button>
          <button onClick={togglePlay} className="flex items-center justify-center p-2">
            {isPlaying ? <PauseIcon className="h-4 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer pr-0.5" /> : <PlayIcon className="h-4 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer pl-0.5" />}
          </button>
          <button onClick={nextSong} className="flex items-center justify-center p-2">
            <NextSongIcon className="h-3 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
          </button>
        </div>
        <div className="hidden sm:flex flex-1 items-center space-x-3">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full cursor-pointer rounded-full"
          />
          <p className="text-sm text-neutral-900 dark:text-neutral-100 min-w-[80px]">
            <span className="text-sm tabular-nums inline-block w-[2rem] text-right">{formatTime(currentTime)}</span>
            <span className="text-sm opacity-50 inline-block w-[1rem] text-center">/</span>
            <span className="text-sm tabular-nums inline-block w-[2rem] text-left">{formatTime(duration)}</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-3">
          <button onClick={toggleLoopMode} className="flex items-center justify-center p-2" aria-label="Change loop mode">
            {isSingleLoop ? (
              <Repeat1Icon className="h-4 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
            ) : (
              <RepeatIcon className="h-4 w-auto text-neutral-900 dark:text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
            )}
          </button>
          <button onClick={toggleShuffleMode} className={`flex items-center justify-center p-2 ${isShuffle ? 'opacity-100' : 'opacity-60'} hover:opacity-100 duration-200`} aria-label="Change to shuffle mode">
            <ShuffleIcon className="h-4 w-auto text-neutral-900 dark:text-neutral-100 cursor-pointer" />
          </button>
        </div>
        <div className="hidden md:flex items-center">
          <div className="relative group">
            <button
              onClick={toggleMuted}
              className="flex items-center justify-center p-2 text-neutral-900 dark:text-neutral-100 cursor-pointer"
              aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <MuteIcon className="h-4 w-4 z-30" />
              ) : (
                <VolumeIcon className="h-4 w-4 z-30" />
              )}
            </button>
            {/* hover popup vertical slider */}
            <div className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 z-20 opacity-0 group-hover:opacity-100 transition duration-200 group-hover:block group-focus-within:block">
              <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-2 dark:shadow-lg">
                <div className="flex h-40 items-start justify-center px-2 pt-2">
                  <Slider
                    value={[Math.round(volume * 100)]}
                    max={100}
                    step={5}
                    onValueChange={handleVolumeChange}
                    orientation="vertical"
                    className="h-28 w-4 cursor-pointer bg-neutral-300 dark:bg-neutral-700 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 移动端播放弹窗 */}
    <AnimatePresence>
      {isMobilePlayerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white/50 dark:bg-black/50 z-50 flex items-end"
          onClick={() => setIsMobilePlayerOpen(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 拖拽条 */}
            <div 
              className="flex justify-center pt-3 pb-6 cursor-pointer"
              onMouseDown={(e) => {
                const startY = e.clientY;
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  if (deltaY > 50) {
                    setIsMobilePlayerOpen(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  }
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const handleTouchMove = (moveEvent: TouchEvent) => {
                  const deltaY = moveEvent.touches[0].clientY - startY;
                  if (deltaY > 50) {
                    setIsMobilePlayerOpen(false);
                    document.removeEventListener('touchmove', handleTouchMove);
                    document.removeEventListener('touchend', handleTouchEnd);
                  }
                };
                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };
                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
              }}
            >
              <div className="w-12 h-1 bg-neutral-400 dark:bg-neutral-600 rounded-full"></div>
            </div>

            <div className="px-6 pb-8">
            {/* 专辑封面 */}
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <Image
                src={songs[currentIndex].cover}
                alt={songs[currentIndex].title}
                width={280}
                height={280}
                className="rounded-2xl object-cover shadow-2xl"
              />
            </motion.div>

            {/* 歌曲信息 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-center mb-8"
            >
              <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-2 mb-2">
                {songs[currentIndex].title}
                {songs[currentIndex].isExplicit && <ExplicitIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">{songs[currentIndex].artist}</div>
            </motion.div>

            {/* 进度条 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mb-8"
            >
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="w-full cursor-pointer rounded-full"
              />
              <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* 控制按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="flex items-center justify-center space-x-8"
            >
              <button 
                onClick={toggleShuffleMode} 
                className={`p-3 ${isShuffle ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-opacity`}
                aria-label="Toggle shuffle"
              >
                <ShuffleIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
              </button>
              
              <button onClick={prevSong} className="p-3" aria-label="Previous song">
                <PrevSongIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="p-4 bg-neutral-900 dark:bg-neutral-100 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-800" />
                ) : (
                  <PlayIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-800 ml-1 -mr-1" />
                )}
              </button>
              
              <button onClick={nextSong} className="p-3" aria-label="Next song">
                <NextSongIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
              </button>
              
              <button 
                onClick={toggleLoopMode} 
                className={`p-3 ${isSingleLoop ? 'opacity-100' : 'opacity-100'} hover:opacity-100 transition-opacity`}
                aria-label="Toggle loop"
              >
                {isSingleLoop ? (
                  <Repeat1Icon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                ) : (
                  <RepeatIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                )}
              </button>
            </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
});

Player.displayName = 'Player';

export default Player;
