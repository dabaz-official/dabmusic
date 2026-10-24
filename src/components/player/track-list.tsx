"use client";

import { Pause, Play } from "lucide-react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";
import type { Song } from "@/lib/types";

import { usePlayer } from "./player-provider";

/**
 * The album's tracks as playable rows: clicking a row makes the album the
 * queue and starts from that row; clicking the current row toggles playback.
 */
export function TrackList({ songs }: { songs: Song[] }) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  return (
    <ol className="divide-y divide-border">
      {songs.map((song) => {
        const active = song.id === currentSong?.id;
        const rowPlaying = active && isPlaying;
        return (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => (active ? togglePlay() : play(song, songs))}
              className="group flex w-full items-center gap-4 py-2.5 pr-2 text-left"
              aria-label={`Play ${song.title}`}
            >
              <span className="flex w-8 shrink-0 justify-center">
                {active ? (
                  rowPlaying ? (
                    <Pause size={16} aria-hidden="true" fill="currentColor" className="text-text-primary" />
                  ) : (
                    <Play size={16} aria-hidden="true" fill="currentColor" className="text-text-primary" />
                  )
                ) : (
                  <>
                    <span className="text-sm tabular-nums text-text-tertiary group-hover:hidden">
                      {song.trackNumber}
                    </span>
                    <Play
                      size={16}
                      aria-hidden="true"
                      fill="currentColor"
                      className="hidden text-text-primary group-hover:block"
                    />
                  </>
                )}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-base ${
                  active ? "font-medium text-text-primary" : "text-text-primary"
                }`}
              >
                {song.title}
              </span>
              {song.explicit && <ExplicitBadge />}
              <span className="w-12 shrink-0 text-right text-sm tabular-nums text-text-tertiary">
                {formatTime(song.duration)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
