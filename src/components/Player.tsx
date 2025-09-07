import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';

import { Song } from '@/lib/songs';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, VolumeIcon, MuteIcon, ShuffleIcon, RepeatIcon, Repeat1Icon } from '@/components/icon/PlayerIcon';

interface PlayerProps {
  songs: Song[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

const Player = forwardRef<{ startPlay: () => void }, PlayerProps>(({ songs, currentIndex, setCurrentIndex }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 音量 0-1
  const [muted, setMuted] = useState(false);
  const prevVolumeRef = useRef(1);
  const [isSingleLoop, setIsSingleLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

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
  }, [isSingleLoop, isShuffle, currentIndex, songs, setCurrentIndex]);

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

  return (
    <div className="fixed bottom-6 md:bottom-8 left-6 right-6 bg-neutral-800 py-2 pl-1 pr-4 shadow-md rounded-full items-center mx-auto w-auto max-w-[64rem]">
      <audio ref={audioRef} />
      <div className="flex items-center space-x-4 h-8">
        <div className="relative flex items-center space-x-3">
          <div className="relative">
            {/* mobile play/pause overlay */}
            <button
              onClick={togglePlay}
              className="sm:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full text-neutral-100 bg-neutral-800/50 backdrop-blur-sm active:bg-neutral-800/60 active:scale-95 transition"
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
          <div className="relative w-48 sm:w-24 md:w-32 min-w-0 overflow-hidden">
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium text-neutral-100 whitespace-nowrap overflow-hidden flex items-center">
                {songs[currentIndex].title}
                {songs[currentIndex].isExplicit && <ExplicitIcon className="h-3 w-3 text-neutral-400 ml-1" />}
              </div>
              <div className="text-xs text-neutral-400 whitespace-nowrap overflow-hidden">
                {songs[currentIndex].artist}
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-neutral-800 to-transparent hidden sm:flex" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={prevSong} className="flex items-center justify-center p-2">
            <PrevSongIcon className="h-3 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
          </button>
          <button onClick={togglePlay} className="flex items-center justify-center p-2">
            {isPlaying ? <PauseIcon className="h-4 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer pr-0.5" /> : <PlayIcon className="h-4 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer pl-0.5" />}
          </button>
          <button onClick={nextSong} className="flex items-center justify-center p-2">
            <NextSongIcon className="h-3 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
          </button>
        </div>
        <div className="hidden sm:flex flex-1 items-center space-x-3">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full cursor-pointer bg-neutral-300 rounded-full"
          />
          <p className="text-sm text-neutral-100 min-w-[80px]">
            <span className="text-sm text-neutral-100 w-[40px]">{formatTime(currentTime)}</span>
            <span className="text-sm text-neutral-100 opacity-60 min-w-[80px]"> / </span>
            <span className="text-sm text-neutral-100 min-w-[80px]">{formatTime(duration)}</span>
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-3">
          <button onClick={toggleLoopMode} className="flex items-center justify-center p-2" aria-label="Change loop mode">
            {isSingleLoop ? (
              <Repeat1Icon className="h-4 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
            ) : (
              <RepeatIcon className="h-4 w-auto text-neutral-100 hover:opacity-80 duration-200 cursor-pointer" />
            )}
          </button>
          <button onClick={toggleShuffleMode} className={`flex items-center justify-center p-2 ${isShuffle ? 'opacity-100' : 'opacity-60'} hover:opacity-100 duration-200`} aria-label="Change to shuffle mode">
            <ShuffleIcon className="h-4 w-auto text-neutral-100 cursor-pointer" />
          </button>
        </div>
        <div className="hidden md:flex items-center">
          <div className="relative group">
            <button
              onClick={toggleMuted}
              className="flex items-center justify-center p-2 text-neutral-100 cursor-pointer"
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
              <div className="rounded-full bg-neutral-800 p-2 shadow-lg">
                <div className="flex h-40 items-start justify-center px-2 pt-2">
                  <Slider
                    value={[Math.round(volume * 100)]}
                    max={100}
                    step={5}
                    onValueChange={handleVolumeChange}
                    orientation="vertical"
                    className="h-28 w-4 cursor-pointer bg-neutral-300 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Player.displayName = 'Player';

export default Player;
