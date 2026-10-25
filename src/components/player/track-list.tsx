"use client";

import { ExplicitBadge } from "@/components/explicit-badge";
import type { Album } from "@/lib/types";

import { IconPause, IconPlay } from "./player-icons";
import { usePlayer } from "./player-provider";

/**
 * The album's tracks as playable rows: clicking a row plays the album from
 * that row; clicking the current row toggles playback.
 */
export function TrackList({ album }: { album: Album }) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  return (
    <ol className="divide-y divide-border">
      {album.tracks.map((song) => {
        const active = song.id === currentSong?.id;
        const rowPlaying = active && isPlaying;
        return (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => (active ? togglePlay() : play(song, album))}
              className="group flex w-full items-center gap-4 py-2.5 pr-2 text-left"
              aria-label={`Play ${song.title}`}
            >
              <span className="flex w-8 shrink-0 justify-center">
                {active ? (
                  rowPlaying ? (
                    <IconPause className="h-4 w-auto text-text-primary" />
                  ) : (
                    <IconPlay className="h-4 w-auto text-text-primary" />
                  )
                ) : (
                  <>
                    <span className="text-sm tabular-nums text-text-tertiary group-hover:hidden">
                      {song.trackNumber}
                    </span>
                    <IconPlay className="hidden h-4 w-auto text-text-primary group-hover:block" />
                  </>
                )}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-base text-text-primary ${
                  active ? "font-semibold" : "font-normal"
                }`}
              >
                {song.title}
              </span>
              {song.explicit && <ExplicitBadge />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
