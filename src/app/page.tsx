'use client';

import { useState } from 'react';

import { albums } from '@/lib/albums';
import AlbumList from '@/components/layout/AlbumList';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Home() {
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const { setCurrentSongs, setCurrentSongIndex, setHasPlayed, playerRef } = usePlayer();

  const handleAlbumSelect = (index: number) => {
    setCurrentAlbumIndex(index);
    setCurrentSongs(albums[index].songs);
    setCurrentSongIndex(0);
    setTimeout(() => {
      playerRef.current?.startPlay();
    }, 100);
    setHasPlayed(true);
  };

  return (
    <div className="container px-6 mx-auto">
      <AlbumList albums={albums} />
    </div>
  );
}
