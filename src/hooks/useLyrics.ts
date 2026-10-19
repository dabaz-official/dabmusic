'use client';

import { useEffect, useState } from 'react';

import { EMPTY_LYRICS, parseLyrics, type Lyrics } from '@/lib/lrc';

interface LoadedLyrics {
  url: string;
  lyrics: Lyrics;
}

/**
 * Fetches and parses the `.lrc` file behind `url`.
 *
 * The result carries the URL it came from and is only handed back while that URL
 * is still current, so a slow load can never show another track's lyrics — and
 * no reset effect is needed when the track changes.
 */
export function useLyrics(url: string | undefined): Lyrics {
  const [loaded, setLoaded] = useState<LoadedLyrics | null>(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load lyrics: ${response.status}`);
        return response.text();
      })
      .then((source) => setLoaded({ url, lyrics: parseLyrics(source) }))
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return;
        setLoaded({ url, lyrics: EMPTY_LYRICS });
      });

    return () => controller.abort();
  }, [url]);

  return url && loaded?.url === url ? loaded.lyrics : EMPTY_LYRICS;
}
