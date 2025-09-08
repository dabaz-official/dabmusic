import { motion } from 'motion/react';
import Image from 'next/image';
import { Slider } from '@/components/ui/slider';
import { NextSongIcon, PauseIcon, PlayIcon, PrevSongIcon, ExplicitIcon, ShuffleIcon, RepeatIcon, Repeat1Icon } from '@/components/icon/PlayerIcon';
import { Song } from '@/lib/albums';

interface MobilePlayerModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  songs: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  isSingleLoop: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  togglePlay: () => void;
  prevSong: () => void;
  nextSong: () => void;
  toggleShuffleMode: () => void;
  toggleLoopMode: () => void;
  handleProgressChange: (value: number[]) => void;
  formatTime: (time: number) => string;
}

const MobilePlayerModal = ({
  isOpen,
  setIsOpen,
  songs,
  currentIndex,
  isPlaying,
  isShuffle,
  isSingleLoop,
  progress,
  currentTime,
  duration,
  togglePlay,
  prevSong,
  nextSong,
  toggleShuffleMode,
  toggleLoopMode,
  handleProgressChange,
  formatTime,
}: MobilePlayerModalProps) => {
  if (!isOpen || songs.length === 0) return null;
  
  const currentSong = songs[currentIndex];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <motion.div
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
                setIsOpen(false);
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
                setIsOpen(false);
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
          <div className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full"></div>
        </div>
        
        {/* 内容区域 */}
        <div className="px-6 pb-10 flex flex-col items-center">
          {/* 专辑封面 */}
          <div className="relative w-64 h-64 mb-8">
            <Image
              src={currentSong.cover}
              alt={currentSong.title}
              fill
              className="object-cover rounded-lg shadow-lg"
            />
          </div>
          
          {/* 歌曲信息 */}
          <div className="w-full text-center mb-8">
            <div className="flex items-center justify-center mb-1">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mr-2">
                {currentSong.title}
              </h2>
              {currentSong.isExplicit && (
                <ExplicitIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              )}
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">{currentSong.artist}</p>
          </div>
          
          {/* 进度条 */}
          <div className="w-full mb-8">
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
          <div className="flex items-center justify-center space-x-8 w-full">
            <button 
              onClick={toggleShuffleMode} 
              className={`p-3 ${isShuffle ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-opacity`}
              aria-label="Toggle shuffle"
            >
              <ShuffleIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
            </button>
            
            <button onClick={prevSong} className="p-3" aria-label="Previous song">
              <PrevSongIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
            </button>
            
            <button 
              onClick={togglePlay} 
              className="p-3 bg-neutral-900 dark:bg-neutral-100 rounded-full h-16 w-16 flex items-center justify-center active:scale-95 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-900" />
              ) : (
                <PlayIcon className="h-8 w-8 text-neutral-100 dark:text-neutral-900 ml-1" />
              )}
            </button>
            
            <button onClick={nextSong} className="p-3" aria-label="Next song">
              <NextSongIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
            </button>
            
            <button 
              onClick={toggleLoopMode} 
              className={`p-3 ${isSingleLoop ? 'opacity-100' : 'opacity-60'} hover:opacity-100 transition-opacity`}
              aria-label="Toggle loop mode"
            >
              {isSingleLoop ? (
                <Repeat1Icon className="h-6 w-6 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
              ) : (
                <RepeatIcon className="h-6 w-6 text-neutral-900 dark:text-neutral-100 cursor-pointer" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MobilePlayerModal;