'use client';

import { useState, useRef } from 'react';

import { albums } from '@/lib/albums';
import Player from '@/components/Player';
import { motion } from 'motion/react';
import AlbumList from '@/components/layout/AlbumList';

export default function Home() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  const handleAlbumSelect = (index: number) => {
    setCurrentAlbumIndex(index);
    setCurrentSongIndex(0);
    setTimeout(() => {
      playerRef.current?.startPlay();
    }, 100);
    if (!hasPlayed) setHasPlayed(true);
  };

  return (
    <div className="container px-6 mx-auto">
      <AlbumList albums={albums} onAlbumSelect={handleAlbumSelect} />
      {hasPlayed && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Player
            ref={playerRef}
            songs={albums[currentAlbumIndex].songs}
            currentIndex={currentSongIndex}
            setCurrentIndex={setCurrentSongIndex}
          />
        </motion.div>
      )}
    </div>
  );
}
