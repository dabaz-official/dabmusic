"use client";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";
import type { Album } from "@/lib/types";

import { PlayPauseIcon } from "./player-icons";
import { usePlayer } from "./player-provider";

/**
 * The album's tracks as playable rows: clicking a row plays the album from
 * that row; clicking the current row toggles playback.
 */
export function TrackList({ album }: { album: Album }) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  // Row separators are a translucent hairline — same alpha as the shell
  // edges — rather than an opaque border token.
  return (
    <ol className="divide-y divide-(--dz-hairline)">
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
                  <PlayPauseIcon
                    playing={rowPlaying}
                    className="h-3.5 w-auto text-text-primary"
                  />
                ) : (
                  <>
                    <span className="text-xs tabular-nums text-text-tertiary group-hover:hidden">
                      {song.trackNumber}
                    </span>
                    <PlayPauseIcon
                      playing={false}
                      className="hidden h-3.5 w-auto text-text-primary group-hover:block"
                    />
                  </>
                )}
              </span>
              {/* Title and explicit mark travel together; the row's free
                  space sits after them, not between. */}
              <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                <span
                  className={`truncate text-xs text-text-primary ${
                    active ? "font-semibold" : "font-normal"
                  }`}
                >
                  {song.title}
                </span>
                {/* 9px = the rendered cap height of the 12px title (same rule
                    as the album cards). */}
                {song.explicit && (
                  <ExplicitBadge className="h-[9px] w-[9px]" />
                )}
              </span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-text-tertiary">
                {song.duration > 0 ? formatTime(song.duration) : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
