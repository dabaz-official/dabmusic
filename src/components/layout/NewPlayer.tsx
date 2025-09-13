import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

import { Song, albums } from '@/lib/albums';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon, CloseIcon, OpenLyricsIcon, CloseLyricsIcon } from '@/components/icon/PlayerIcon';

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
  const [lyricsText, setLyricsText] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<{ timeSec: number; text: string }[]>([]);
  const [fadingLyricIndex, setFadingLyricIndex] = useState<number | null>(null);
  const lastLyricIndexRef = useRef<number>(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentLyricElementRef = useRef<HTMLDivElement | null>(null);
  const cleanedLyrics = useMemo(() => {
    if (!lyricsText) return '';
    // 移除时间戳 [mm:ss.xx] 或 [m:ss]
    const noTime = lyricsText.replace(/\[(\d{1,2}):(\d{2})(?:\.\d{1,2})?\]/g, '');
    // 移除元信息标签，如 [ar:xxx] [ti:xxx] 等
    const noMeta = noTime.replace(/\[[a-zA-Z]+:[^\]]*\]/g, '');
    // 去除多余空白行
    const lines = noMeta.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    return lines.join('\n');
  }, [lyricsText]);

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

  // 加载歌词（如果当前歌曲含有 lyrics 路径）
  useEffect(() => {
    const current = songs[currentIndex];
    let cancelled = false;
    if (current?.lyrics) {
      fetch(current.lyrics)
        .then((res) => (res.ok ? res.text() : Promise.reject(new Error('Failed to load lyrics'))))
        .then((text) => {
          if (!cancelled) setLyricsText(text);
        })
        .catch(() => {
          if (!cancelled) setLyricsText('');
        });
    } else {
      setLyricsText('');
    }
    return () => {
      cancelled = true;
    };
  }, [currentIndex, songs]);

  // 关闭歌词面板当切歌或无歌词
  useEffect(() => {
    const hasLyrics = Boolean(songs[currentIndex]?.lyrics);
    if (!hasLyrics) setIsLyricsOpen(false);
  }, [currentIndex, songs]);

  // 解析 LRC 歌词为带时间戳的行
  useEffect(() => {
    if (!lyricsText) {
      setParsedLyrics([]);
      return;
    }
    const lines = lyricsText.split(/\r?\n/);
    const entries: { timeSec: number; text: string }[] = [];
    const timeTagRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/g;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // 跳过元信息 [ar:], [ti:], [by:], [offset:], [al:]
      if (/^\[(ar|ti|by|offset|al):/i.test(line)) continue;
      const tags: { m: number; s: number; cs: number }[] = [];
      let match: RegExpExecArray | null;
      timeTagRegex.lastIndex = 0;
      while ((match = timeTagRegex.exec(line)) !== null) {
        const m = parseInt(match[1] || '0', 10);
        const s = parseInt(match[2] || '0', 10);
        const cs = parseInt(match[3] || '0', 10);
        tags.push({ m, s, cs });
      }
      const text = line.replace(timeTagRegex, '').trim();
      if (tags.length === 0 || !text) continue;
      for (const t of tags) {
        const timeSec = t.m * 60 + t.s + (isNaN(t.cs) ? 0 : t.cs / 100);
        entries.push({ timeSec, text });
      }
    }
    entries.sort((a, b) => a.timeSec - b.timeSec);
    setParsedLyrics(entries);
  }, [lyricsText]);

  // 当前歌词索引（提前0.5秒触发动画）
  const currentLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (parsedLyrics[i].timeSec <= currentTime + 0.5) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, currentTime]);

  // 桌面端：歌词自动滚动逻辑 - 使用scrollIntoView确保居中
  useEffect(() => {
    if (isLyricsOpen && !isUserScrolling && currentLyricElementRef.current) {
      const timer = setTimeout(() => {
        if (currentLyricElementRef.current) {
          currentLyricElementRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [currentLyricIndex, isUserScrolling, isLyricsOpen]);

  // 记录当前歌词索引变化
  useEffect(() => {
    if (currentLyricIndex !== lastLyricIndexRef.current) {
      lastLyricIndexRef.current = currentLyricIndex;
    }
  }, [currentLyricIndex]);

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
          className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* 关闭按钮 - 移动端和桌面端都可见 */}
          <button 
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 left-4 text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition z-10 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
      
          {/* 桌面端布局 - 左右分栏 */}
          <div className="hidden md:flex w-full max-w-6xl h-full items-center" onClick={(e) => e.stopPropagation()}>
            {/* 左侧：歌曲信息和控制 */}
            <div className={`flex flex-col items-center justify-center space-y-8 transition-all duration-300 ${
              isLyricsOpen ? 'w-1/2 pr-8' : 'w-full'
            }`}>
              {/* 专辑封面 */}
              <div className="relative">
                <Image
                  src={currentSong.cover}
                  alt={currentSong.title}
                  width={400}
                  height={400}
                  className="rounded-2xl object-cover shadow-2xl"
                />
              </div>

              {/* 歌曲信息 */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <h2 className="text-2xl font-bold text-black dark:text-white">{currentSong.title}</h2>
                  {currentSong.isExplicit && <ExplicitIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />}
                </div>
                <div className="space-y-1">
                  <p className="text-lg text-neutral-700 dark:text-neutral-300">{currentSong.artist}</p>
                </div>
              </div>

              {/* 进度条 */}
              <div className="w-96 space-y-3">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={handleProgressChange}
                  className="w-full cursor-pointer"
                />
                <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center space-x-8">
                <button onClick={toggleShuffleMode} className={`p-3 ${isShuffle ? 'text-black dark:text-white' : 'text-neutral-500'} hover:text-black dark:hover:text-white transition cursor-pointer`}>
                  <ShuffleIcon className="h-4 w-4" />
                </button>
                <button onClick={prevSong} className="p-3 text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition cursor-pointer">
                  <PrevSongIcon className="h-8 w-8" />
                </button>
                <button onClick={togglePlay} className="p-4 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition cursor-pointer">
                  {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8 pl-1" />}
                </button>
                <button onClick={nextSong} className="p-3 text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition cursor-pointer">
                  <NextSongIcon className="h-8 w-8" />
                </button>
                <button onClick={toggleLoopMode} className={`p-3 ${isSingleLoop ? 'text-black dark:text-white' : 'text-black dark:text-white'} hover: text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer`}>
                  {isSingleLoop ? <Repeat1Icon className="h-4 w-4" /> : <RepeatIcon className="h-4 w-4" />}
                </button>
              </div>

              {/* 音量控制 */}
              <div className="flex items-center space-x-4 w-96">
                <button onClick={toggleMuted} className="text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition cursor-pointer">
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

            {/* 右侧：歌词显示 */}
            <AnimatePresence>
              {isLyricsOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.3 }}
                  className="w-1/2 h-full flex flex-col pl-8"
                >
                  <div 
                    className="flex-1 relative overflow-y-auto"
                    ref={lyricsScrollRef}
                    onScroll={(e) => {
                      setIsUserScrolling(true);
                      if (userScrollTimeoutRef.current) {
                        clearTimeout(userScrollTimeoutRef.current);
                      }
                      userScrollTimeoutRef.current = setTimeout(() => {
                        setIsUserScrolling(false);
                      }, 2000);
                    }}
                  >
                    {/* 歌词内容 - 简单有效的居中方案 */}
                    <div className="px-4 py-[50vh]">
                      {parsedLyrics.length > 0 ? (
                        <div className="space-y-8">
                          {parsedLyrics.map((lyric, index) => {
                            const isActive = currentLyricIndex === index;
                            const isPast = index < currentLyricIndex;
                            return (
                              <motion.div
                                key={index}
                                className={`leading-relaxed cursor-pointer transition-all duration-500 text-4xl font-bold ${
                                  isActive 
                                    ? 'text-black dark:text-white' 
                                    : isPast 
                                      ? 'text-black dark:text-white' 
                                      : 'text-black dark:text-white'
                                } ${
                                  !isActive ? 'opacity-40 dark:opacity-20' : 'opacity-100'
                                }`}
                                onClick={() => {
                                  if (audioRef.current) {
                                    audioRef.current.currentTime = lyric.timeSec;
                                  }
                                }}
                                ref={el => {
                                  if (currentLyricIndex === index) {
                                    currentLyricElementRef.current = el;
                                  }
                                }}
                              >
                                {lyric.text}
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-neutral-400 text-lg text-center">
                          Oops, we don't have the lyrics for this one.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 歌词按钮 - 桌面端 */}
          {songs[currentIndex]?.lyrics && (
            <button
              onClick={() => setIsLyricsOpen(!isLyricsOpen)}
              className="hidden md:block fixed bottom-4 right-4 text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 transition z-10 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full cursor-pointer"
            >
              {isLyricsOpen ? (
                <CloseLyricsIcon className="h-6 w-6" />
              ) : (
                <OpenLyricsIcon className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
});

Player.displayName = 'Player';
export default Player;