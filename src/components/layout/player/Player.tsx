import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

import { Song, albums } from '@/lib/albums';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon, CloseIcon, OpenLyricsIcon, CloseLyricsIcon } from '@/components/icon/PlayerIcon';

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
  const [isDesktopPlayerOpen, setIsDesktopPlayerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [lyricsText, setLyricsText] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<{ timeSec: number; text: string }[]>([]);
  const [fadingLyricIndex, setFadingLyricIndex] = useState<number | null>(null);
  const lastLyricIndexRef = useRef<number>(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  
  // 控制弹窗打开时禁止背景滚动
  useEffect(() => {
    if (isMobilePlayerOpen || isDesktopPlayerOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY;
      // 禁止滚动
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // 恢复滚动
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        // 恢复滚动位置
        window.scrollTo(0, scrollY);
      };
    }
  }, [isMobilePlayerOpen, isDesktopPlayerOpen]);

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
      
      // ESC key closes player modals
      if (e.key === 'Escape') {
        setIsMobilePlayerOpen(false);
        setIsDesktopPlayerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPlaying]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint in Tailwind is 640px
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
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
    // 检查点击的是否是控制按钮或其他不应触发弹窗的元素
    const target = e.target as HTMLElement;
    
    // 检查是否点击了按钮（上一首、播放/暂停、下一首、循环、随机、音量）
    const isControlButton = target.closest('button');
    
    // 检查是否点击了进度条
    const isProgressSlider = target.closest('[role="slider"]') || 
                            target.closest('.Slider') || 
                            target.closest('.SliderTrack') || 
                            target.closest('.SliderRange') || 
                            target.closest('.SliderThumb');
    
    // 检查是否点击了音量弹窗
    const isVolumePopup = target.closest('.group-hover\\:opacity-100') || 
                         target.closest('.group-hover\\:block') || 
                         target.closest('.group-focus-within\\:block');
    
    // 如果不是控制按钮、进度条或音量弹窗，则根据设备类型打开对应弹窗
    if (!isControlButton && !isProgressSlider && !isVolumePopup) {
      if (isMobile) {
        setIsMobilePlayerOpen(true);
      } else {
        setIsDesktopPlayerOpen(true);
      }
    }
  };

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
            className="w-full bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-t-3xl"
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
                  <PauseIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-900" />
                ) : (
                  <PlayIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-900 ml-1 -mr-1" />
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
    
    {/* 桌面端全屏播放弹窗 */}
    <AnimatePresence>
      {isDesktopPlayerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-white dark:bg-black z-50 flex items-center justify-center"
          onClick={() => setIsDesktopPlayerOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative w-full h-full bg-white dark:bg-black p-8 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button 
              onClick={() => setIsDesktopPlayerOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors duration-200 cursor-pointer"
              aria-label="关闭播放器"
            >
              <CloseIcon className="h-8 w-8 text-neutral-900 dark:text-neutral-100" />
            </button>
            
            <div className={`relative h-full max-w-6xl mx-auto ${isLyricsOpen ? 'md:flex md:flex-row md:gap-10 md:items-center' : 'flex flex-col items-center justify-center gap-8'}`}>
              {/* 左侧：封面+信息+控制 */}
              <div className={`${isLyricsOpen ? 'w-full md:w-1/2 flex flex-col items-center gap-6' : 'w-full flex flex-col items-center gap-6'}`}>
                <Image
                  src={songs[currentIndex].cover}
                  alt={songs[currentIndex].title}
                  width={440}
                  height={440}
                  className="rounded-2xl object-cover shadow-2xl"
                  priority
                />

                {/* 歌曲信息 */}
                <div className="text-center">
                  <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 justify-center">
                    {songs[currentIndex].title}
                    {songs[currentIndex].isExplicit && <ExplicitIcon className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />}
                  </div>
                  <div className="text-lg text-neutral-600 dark:text-neutral-400">
                    {songs[currentIndex].artist}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="w-full max-w-md">
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
                </div>

                {/* 控制按钮 */}
                <div className="flex items-center justify-center space-x-4 w-full -mt-2">
                  <button 
                    onClick={toggleShuffleMode} 
                    className={`p-3 ${isShuffle ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-opacity`}
                    aria-label="Toggle shuffle"
                  >
                    <ShuffleIcon className="h-4 w-4 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
                  </button>
                  
                  <button onClick={prevSong} className="p-3" aria-label="Previous song">
                    <PrevSongIcon className="h-5 w-5 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
                  </button>
                  
                  <button 
                    onClick={togglePlay} 
                    className="p-4 bg-neutral-900 dark:bg-neutral-100 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <PauseIcon className="h-4 w-4 text-neutral-100 dark:text-neutral-900" />
                    ) : (
                      <PlayIcon className="h-4 w-4 text-neutral-100 dark:text-neutral-900 ml-0.5 -mr-0.5" />
                    )}
                  </button>
                  
                  <button onClick={nextSong} className="p-3" aria-label="Next song">
                    <NextSongIcon className="h-5 w-5 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
                  </button>
                  
                  <button 
                    onClick={toggleLoopMode} 
                    className={`p-3 ${isSingleLoop ? 'opacity-100' : 'opacity-100'} hover:opacity-100 transition-opacity`}
                    aria-label="Toggle loop"
                  >
                    {isSingleLoop ? (
                      <Repeat1Icon className="h-4 w-4 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
                    ) : (
                      <RepeatIcon className="h-4 w-4 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center space-x-4 justify-center w-full">
                  <button
                    onClick={toggleMuted}
                    className="p-2 text-neutral-900 dark:text-neutral-100"
                    aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    {muted || volume === 0 ? (
                      <MuteIcon className="h-5 w-5 cursor-pointer" />
                    ) : (
                      <VolumeIcon className="h-5 w-5 cursor-pointer" />
                    )}
                  </button>
                  <Slider
                    value={[Math.round(volume * 100)]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-full max-w-[200px] cursor-pointer rounded-full"
                  />
                </div>
              </div>

              {/* 右侧：歌词列（打开歌词时显示）*/}
              {isLyricsOpen && (
                <div className="w-full md:w-1/2 mt-6 md:mt-0 flex items-center justify-center no-scrollbar">
                  {parsedLyrics.length > 0 ? (
                    <div 
                      className="relative w-full h-[calc(100vh-8rem)] overflow-y-auto text-neutral-900 dark:text-neutral-100 px-4 scrollbar-none" 
                      onWheel={() => {
                        setIsUserScrolling(true);
                        if (userScrollTimeoutRef.current) {
                          clearTimeout(userScrollTimeoutRef.current);
                        }
                        userScrollTimeoutRef.current = setTimeout(() => {
                          setIsUserScrolling(false);
                        }, 1600);
                      }}
                      onTouchStart={() => {
                        setIsUserScrolling(true);
                        if (userScrollTimeoutRef.current) {
                          clearTimeout(userScrollTimeoutRef.current);
                        }
                      }}
                      onTouchEnd={() => {
                        if (userScrollTimeoutRef.current) {
                          clearTimeout(userScrollTimeoutRef.current);
                        }
                        userScrollTimeoutRef.current = setTimeout(() => {
                          setIsUserScrolling(false);
                        }, 1600);
                      }}
                    >
                      {/* 歌词容器 - 可滚动显示全部歌词 */}
                      <div className="py-[30vh]">
                        {parsedLyrics.map((lyric, index) => (
                          <div 
                              key={`${lyric.timeSec}-${index}`}
                              className={`text-2xl md:text-3xl font-bold py-4 transition-all duration-300 text-neutral-900 dark:text-neutral-100 cursor-pointer ${currentLyricIndex === index ? 'opacity-100' : `opacity-20 ${isUserScrolling ? '' : 'blur-[1.2px]'}`}`}
                              ref={el => {
                                // 当前播放行自动滚动到视图中央，但仅在用户没有手动滚动时
                                if (currentLyricIndex === index && el && !isUserScrolling) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.currentTime = lyric.timeSec;
                                }
                              }}
                            >
                              {lyric.text}
                            </div>
                        ))}
                      </div>
                      
                      {/* 顶部和底部渐变遮罩 */}
                      <div className="pointer-events-none sticky top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-black to-transparent z-20" />
                      <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent" />
                    </div>
                    ) : (
                    <div className="relative w-full h-[calc(100vh-8rem)] overflow-y-auto text-neutral-900 dark:text-neutral-100 px-4">
                      <div className="py-[30vh] text-center whitespace-pre-wrap text-3xl md:text-4xl font-bold">
                        {cleanedLyrics ? cleanedLyrics : '歌词加载中...'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 固定右下角：歌词按钮（与弹窗同时渐显） */}
              <AnimatePresence>
                {isDesktopPlayerOpen && (
                  <motion.div
                    key="lyrics-fab"
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed right-6 bottom-6 z-[60]"
                  >
                    {(() => {
                      const hasLyrics = Boolean(songs[currentIndex]?.lyrics);
                      return (
                        <button
                          onClick={() => hasLyrics && setIsLyricsOpen((p) => !p)}
                          aria-label={isLyricsOpen ? "隐藏歌词" : "显示歌词"}
                          disabled={!hasLyrics}
                          className={`h-12 w-12 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md flex items-center justify-center transition shadow-sm cursor-pointer ${hasLyrics ? 'opacity-100 hover:bg-white/90 dark:hover:bg-black/60' : 'opacity-40 cursor-not-allowed'}`}
                        >
                          {isLyricsOpen ? (
                            <CloseLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                          ) : (
                            <OpenLyricsIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100" />
                          )}
                        </button>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
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
