'use client';

import { useState } from 'react';

import { albums } from '@/lib/albums';
import AlbumList from '@/components/layout/AlbumList';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Home() {
  const { setCurrentSongs, setCurrentSongIndex, setHasPlayed, playerRef } = usePlayer();

  return (
    <div className="container px-6 mx-auto">
      <AlbumList albums={albums} />
    </div>
  );
}
