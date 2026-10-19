'use client';

import { useEffect, useState } from 'react';

import type { Song } from '@/lib/albums';

/**
 * Total runtime of a track list, read from audio metadata.
 *
 * A single detached element walks the list sequentially rather than opening one
 * `Audio` per track, so an album does not fire fifteen concurrent requests.
 * Returns `null` until every duration is known.
 */
export function useTotalDuration(songs: Song[]): number | null {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (songs.length === 0) {
      setTotal(0);
      return;
    }

    const audio = new Audio();
    audio.preload = 'metadata';

    let cancelled = false;
    let index = 0;
    let sum = 0;

    const detach = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onSkipped);
    };

    function loadNext() {
      if (cancelled) return;
      if (index >= songs.length) {
        setTotal(sum);
        return;
      }
      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onSkipped);
      audio.src = songs[index++].src;
    }

    function onLoaded() {
      detach();
      if (Number.isFinite(audio.duration)) sum += audio.duration;
      loadNext();
    }

    function onSkipped() {
      detach();
      loadNext();
    }

    setTotal(null);
    loadNext();

    return () => {
      cancelled = true;
      detach();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [songs]);

  return total;
}
