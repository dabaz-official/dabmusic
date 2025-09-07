'use client';

import { useState, useRef } from 'react';

import { songs } from '@/lib/songs';
import Player from '@/components/Player';

export default function Home() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const playerRef = useRef<{ startPlay: () => void }>(null);

  return (
    <div className="container mx-auto p-4">
      <ul className="space-y-2">
        {songs.map((song, index) => (
          <li key={index}>
            <button
              onClick={() => {
                setCurrentSongIndex(index);
                setTimeout(() => {
                  playerRef.current?.startPlay();
                }, 100);
              }}
              className="text-blue-500 hover:underline"
            >
              {song.title}
            </button>
          </li>
        ))}
      </ul>
      <Player
        ref={playerRef}
        songs={songs}
        currentIndex={currentSongIndex}
        setCurrentIndex={setCurrentSongIndex}
      />
    </div>
  );
}
