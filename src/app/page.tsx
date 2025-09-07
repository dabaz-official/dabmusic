'use client';

import { useState, useRef } from 'react';

import { songs } from '@/lib/songs';
import Player from '@/components/Player';
import SongList from '@/components/layout/SongList';

export default function Home() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  const handleSongSelect = (index: number) => {
    setCurrentSongIndex(index);
    setTimeout(() => {
      playerRef.current?.startPlay();
    }, 100);
  };

  return (
    <div className="container px-6 mx-auto">
      <SongList songs={songs} onSongSelect={handleSongSelect} />
      <Player
        ref={playerRef}
        songs={songs}
        currentIndex={currentSongIndex}
        setCurrentIndex={setCurrentSongIndex}
      />
    </div>
  );
}
