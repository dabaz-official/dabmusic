import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';

import { Song } from '@/lib/songs';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon } from '@/components/icon/PlayerIcon';

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
      audio.onended = () => setCurrentIndex(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);
    }
  }, [currentIndex]);

  // 当播放状态改变时，控制播放/暂停
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      if (isPlaying) {
        audio.play().catch((e) => console.error('播放失败:', e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const prevSong = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    setCurrentIndex(newIndex);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };
  
  const nextSong = () => {
    const newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = (value[0] / 100) * audio.duration;
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = value[0] / 100;
      setVolume(audio.volume);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-8 left-4 right-4 bg-white border border-neutral-200 py-2 pl-1 pr-4 shadow-md rounded-full items-center mx-auto">
      <audio ref={audioRef} />
      <div className="flex items-center space-x-6 h-8">
         <div className="flex items-center space-x-3">
           <img
             src={songs[currentIndex].cover}
             alt={songs[currentIndex].title}
             width={40}
             height={40}
             className={`rounded-full object-cover ${isPlaying ? 'animate-spin' : ''}`}
             style={{
               animationDuration: '10s',
               animationTimingFunction: 'linear',
               animationIterationCount: isPlaying ? 'infinite' : '0'
             }}
           />
           <div className="flex flex-col min-w-0">
             <div className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden">
               {songs[currentIndex].title}
               {songs[currentIndex].isExplicit && <span className="text-red-500 font-bold ml-1">E</span>}
             </div>
             <div className="text-xs text-gray-500 whitespace-nowrap overflow-hidden">
               {songs[currentIndex].artist}
             </div>
           </div>
         </div>
        <button onClick={prevSong} className="flex items-center justify-center p-2">
          <PrevSongIcon className="h-3 w-auto hover:opacity-80" />
        </button>
        <button onClick={togglePlay} className="flex items-center justify-center p-2">
          {isPlaying ? <PauseIcon className="h-3 w-auto hover:opacity-80" /> : <PlayIcon className="h-3 w-auto hover:opacity-80" />}
        </button>
        <button onClick={nextSong} className="flex items-center justify-center p-2">
          <NextSongIcon className="h-3 w-auto hover:opacity-80" />
        </button>
        <div className="flex-1 flex items-center space-x-3">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full cursor-pointer bg-gray-300 rounded-full"
          />
          <span className="text-sm text-gray-600 min-w-[80px]">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">音量</span>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-20 bg-gray-300 rounded-full"
          />
        </div>
      </div>
    </div>
  );
});

Player.displayName = 'Player';

export default Player;
