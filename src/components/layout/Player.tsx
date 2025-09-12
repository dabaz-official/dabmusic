import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';

import { Song, albums } from '@/lib/albums';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon, CloseIcon } from '@/components/icon/PlayerIcon';

interface PlayerProps {
  songs: Song[];
  albums: typeof albums;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean | ((prev: boolean) => boolean)) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean | ((prev: boolean) => boolean)) => void;
}

const Player = forwardRef<{ startPlay: () => void }, PlayerProps>(({ songs, albums, currentIndex, setCurrentIndex, isPlaying, setIsPlaying, isShuffle, setIsShuffle }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0-1
  const [muted, setMuted] = useState(false);
  const prevVolumeRef = useRef(1);
  const [isSingleLoop, setIsSingleLoop] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useImperativeHandle(ref, () => ({
    startPlay: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play().catch((e) => console.error('播放失败:', e));
        setIsPlaying(true);
      }
    }
  }));

  // 禁用背景滚动
  useEffect(() => {
    if (showFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFullscreen]);

  // 清理全局事件监听器
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 当歌曲索引改变时，加载新歌曲
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = currentSong.src;
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

  // 从专辑页面触发播放事件
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

  const togglePlay = () => setIsPlaying((prev) => !prev);

  // 键盘空格键切换播放/暂停（忽略输入控件）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const isTyping = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') || !!target?.isContentEditable;
        if (isTyping) return;
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
      if (e.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPlaying, showFullscreen]);

  const prevSong = () => {
    let newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    if (isShuffle && songs.length > 1) {
      do {
        newIndex = Math.floor(Math.random() * songs.length);
      } while (newIndex === currentIndex);
    }
    setCurrentIndex(newIndex);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const nextSong = () => {
    let newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    if (isShuffle && songs.length > 1) {
      do {
        newIndex = Math.floor(Math.random() * songs.length);
      } while (newIndex === currentIndex);
    }
    setCurrentIndex(newIndex);
    setTimeout(() => setIsPlaying(true), 100);
  };

  const toggleLoopMode = () => setIsSingleLoop((prev) => !prev);
  const toggleShuffleMode = () => setIsShuffle((prev) => !prev);

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
      const restore = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5;
      audio.muted = false;
      audio.volume = restore;
      setVolume(restore);
      setMuted(false);
    } else {
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
    // 检查点击的是否为控制按钮或进度条
    const target = e.target as HTMLElement;
    const isControlElement = target.closest('button') || 
                           target.closest('[role="slider"]') || 
                           target.closest('.slider-container') ||
                           target.closest('.volume-popup');
    
    if (!isControlElement) {
      setShowFullscreen(true);
    }
  };

  // 处理拖拽开始
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragCurrentY(clientY);
    setIsDragging(true);
    
    // 为鼠标事件添加全局监听器
    if ('clientX' in e) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  // 处理拖拽移动
  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartY === null) return;
    
    const clientY = e.touches[0].clientY;
    setDragCurrentY(clientY);
    
    // 如果向下拖拽超过100px，关闭弹窗
    if (clientY - dragStartY > 100) {
      setShowFullscreen(false);
      setIsDragging(false);
      setDragStartY(null);
      setDragCurrentY(null);
    }
  };

  // 处理鼠标移动（全局）
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || dragStartY === null) return;
    
    const clientY = e.clientY;
    setDragCurrentY(clientY);
    
    // 如果向下拖拽超过100px，关闭弹窗
    if (clientY - dragStartY > 100) {
      setShowFullscreen(false);
      setIsDragging(false);
      setDragStartY(null);
      setDragCurrentY(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStartY(null);
    setDragCurrentY(null);
  };

  // 处理鼠标释放（全局）
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartY(null);
    setDragCurrentY(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (!songs || songs.length === 0) return null;

  const currentSong = songs[currentIndex];
  const currentAlbum = albums.find(album => 
    album.songs.some(song => 
      song.id === currentSong.id && 
      song.src === currentSong.src && 
      song.cover === currentSong.cover
    )
  );

  return (
    <>
      <div 
        className="fixed bottom-6 md:bottom-8 left-6 right-6 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-2 pl-1 pr-4 shadow-md rounded-full items-center mx-auto w-auto max-w-[64rem] cursor-pointer"
        onClick={handlePlayerClick}
      >
        <audio ref={audioRef} />
        <div className="flex items-center space-x-4 h-8">
          <div className="relative flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={togglePlay}
                className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full text-neutral-900 dark:text-neutral-100 bg-neutral-100/50 dark:bg-neutral-800/50 backdrop-blur-sm active:bg-neutral-800/60 active:scale-95 transition"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4 mx-auto" /> : <PlayIcon className="h-4 w-4 mx-auto pl-0.5" />}
              </button>
              <Image
                src={currentSong.cover}
                alt={currentSong.title}
                width={40}
                height={40}
                className="rounded-full object-cover sm:animate-spin"
                style={{
                  animationDuration: '10s',
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />
            </div>
            <div className="relative w-32 sm:w-24 md:w-32 lg:w-44 min-w-0 overflow-hidden">
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap overflow-hidden flex items-center">
                  {currentSong.title}
                  {currentSong.isExplicit && <ExplicitIcon className="h-3 w-3 text-neutral-600 dark:text-neutral-400 ml-1" />}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap overflow-hidden">
                  {currentSong.artist}
                </div>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-neutral-100 dark:from-neutral-900 to-transparent flex" />
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
            <div className="slider-container w-full">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="w-full cursor-pointer rounded-full"
              />
            </div>
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
              <div className="volume-popup pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 mb-2 z-20 opacity-0 group-hover:opacity-100 transition duration-200 group-hover:block group-focus-within:block">
                <div className="rounded-full bg-neutral-100 dark:bg-neutral-900 p-2 dark:shadow-lg">
                  <div className="flex h-40 items-start justify-center px-2 pt-2">
                    <Slider
                      value={[Math.round(volume * 100)]}
                      max={100}
                      step={1}
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

      {/* 全屏播放器弹窗 */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* 关闭按钮 - 移动端和桌面端都可见 */}
          <button 
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 left-4 text-white hover:text-neutral-300 transition z-10 p-2 hover:bg-white/10 rounded-full cursor-pointer"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
      
          <div 
            className="flex flex-col items-center space-y-8 max-w-sm w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 专辑封面 */}
            <div className="relative">
              <Image
                src={currentSong.cover}
                alt={currentSong.title}
                width={1080}
                height={1080}
                className="rounded-2xl object-cover shadow-2xl"
              />
            </div>

            {/* 歌曲信息 */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-2xl font-bold text-white">{currentSong.title}</h2>
                {currentSong.isExplicit && <ExplicitIcon className="h-5 w-5 text-neutral-400" />}
              </div>
              <div className="space-y-1">
                <p className="text-lg text-neutral-300">{currentSong.artist}</p>
              </div>
            </div>

            {/* 进度条 */}
            <div className="w-full space-y-3">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-sm text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* 播放控制 */}
            <div className="flex items-center space-x-8">
              <button onClick={toggleShuffleMode} className={`p-3 ${isShuffle ? 'text-white' : 'text-neutral-500'} hover:text-white transition cursor-pointer`}>
                <ShuffleIcon className="h-4 w-4" />
              </button>
              <button onClick={prevSong} className="p-3 text-white hover:text-neutral-300 transition cursor-pointer">
                <PrevSongIcon className="h-8 w-8" />
              </button>
              <button onClick={togglePlay} className="p-4 bg-white text-black rounded-full hover:bg-neutral-200 transition cursor-pointer">
                {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8 pl-1" />}
              </button>
              <button onClick={nextSong} className="p-3 text-white hover:text-neutral-300 transition cursor-pointer">
                <NextSongIcon className="h-8 w-8" />
              </button>
              <button onClick={toggleLoopMode} className={`p-3 ${isSingleLoop ? 'text-white' : 'text-white'} hover:text-white transition cursor-pointer`}>
                {isSingleLoop ? <Repeat1Icon className="h-4 w-4" /> : <RepeatIcon className="h-4 w-4" />}
              </button>
            </div>

            {/* 音量控制 */}
            <div className="hidden sm:flex items-center space-x-4 w-full">
              <button onClick={toggleMuted} className="text-white hover:text-neutral-300 transition cursor-pointer">
                {muted || volume === 0 ? <MuteIcon className="h-3 w-3" /> : <VolumeIcon className="h-3 w-3" />}
              </button>
              <div className="flex-1">
                <Slider
                  value={[Math.round(volume * 100)]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

Player.displayName = 'Player';
export default Player;