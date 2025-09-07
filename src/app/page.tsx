'use client';

import { useState, useRef } from 'react';

import { songs } from '@/lib/songs';
import Player from '@/components/Player';
import { motion } from 'motion/react';
import SongList from '@/components/layout/SongList';

export default function Home() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setTimeout(() => {
      playerRef.current?.startPlay();
    }, 100);
    if (!hasPlayed) setHasPlayed(true);
  };

  return (
    <div className="container px-6 mx-auto">
      <SongList songs={songs} onSongSelect={handleSongSelect} />
      {hasPlayed && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Player
            ref={playerRef}
            songs={songs}
            currentIndex={currentSongIndex}
            setCurrentIndex={setCurrentSongIndex}
          />
        </motion.div>
      )}
    </div>
  );
}
