import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';

import { Song } from '@/lib/songs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface PlayerProps {
  songs: Song[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

export default function Player({ songs, currentIndex, setCurrentIndex }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 音量 0-1

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.src = songs[currentIndex].src;
      if (isPlaying) audio.play().catch((e) => console.error('播放失败:', e)); // 处理用户交互限制
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100 || 0);
      };
      audio.onended = () => setCurrentIndex(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);
    }
  }, [currentIndex, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) audio.pause();
      else audio.play().catch((e) => console.error('播放失败:', e));
      setIsPlaying(!isPlaying);
    }
  };

  const prevSong = () => setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : songs.length - 1);
  const nextSong = () => setCurrentIndex(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);

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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 p-4 shadow-lg">
      <audio ref={audioRef} />
      <div className="flex items-center space-x-4">
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button onClick={prevSong}>上一首</Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button onClick={togglePlay}>{isPlaying ? '暂停' : '播放'}</Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }}>
          <Button onClick={nextSong}>下一首</Button>
        </motion.div>
        <div className="flex-1 flex items-center space-x-2">
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={handleProgressChange}
            className="w-full"
          />
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>音量</span>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
