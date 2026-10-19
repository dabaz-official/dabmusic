'use client';

import { useEffect, useState } from 'react';

import type { Song } from '@/lib/albums';

interface TotalDuration {
  songs: Song[];
  seconds: number;
}

/**
 * Total runtime of a track list, read from audio metadata.
 *
 * A single detached element walks the list sequentially rather than opening one
 * `Audio` per track, so an album does not fire fifteen concurrent requests.
 * Returns `null` while the durations are still being read.
 */
export function useTotalDuration(songs: Song[]): number | null {
  const [measured, setMeasured] = useState<TotalDuration | null>(null);

  useEffect(() => {
    if (songs.length === 0) return;

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
        setMeasured({ songs, seconds: sum });
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

    loadNext();

    return () => {
      cancelled = true;
      detach();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [songs]);

  // Tagged with the list it describes, so switching albums shows nothing rather
  // than the previous album's runtime.
  if (songs.length === 0) return 0;
  return measured?.songs === songs ? measured.seconds : null;
}
