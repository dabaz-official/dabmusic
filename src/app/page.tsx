'use client';

import { useState } from 'react';

import { songs } from '@/lib/songs';
import Player from '@/components/Player';

export default function Home() {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DabMusic</h1>
      <ul className="space-y-2">
        {songs.map((song, index) => (
          <li key={index}>
            <button
              onClick={() => setCurrentSongIndex(index)}
              className="text-blue-500 hover:underline"
            >
              {song.title}
            </button>
          </li>
        ))}
      </ul>
      <Player
        songs={songs}
        currentIndex={currentSongIndex}
        setCurrentIndex={setCurrentSongIndex}
      />
    </div>
  );
}
