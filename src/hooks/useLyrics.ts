'use client';

import { useEffect, useState } from 'react';

import { EMPTY_LYRICS, parseLyrics, type Lyrics } from '@/lib/lrc';

/**
 * Fetches and parses the `.lrc` file behind `url`. The previous lyrics stay
 * mounted while the next track loads, so switching songs does not flash an
 * empty panel.
 */
export function useLyrics(url: string | undefined): Lyrics {
  const [lyrics, setLyrics] = useState<Lyrics>(EMPTY_LYRICS);

  useEffect(() => {
    if (!url) {
      setLyrics(EMPTY_LYRICS);
      return;
    }

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load lyrics: ${response.status}`);
        return response.text();
      })
      .then((source) => setLyrics(parseLyrics(source)))
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        setLyrics(EMPTY_LYRICS);
      });

    return () => controller.abort();
  }, [url]);

  return lyrics;
}
