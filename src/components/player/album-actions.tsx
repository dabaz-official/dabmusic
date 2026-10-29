"use client";

import type { Album } from "@/lib/types";

import { IconShuffle } from "./player-icons";
import { PlaySongsButton } from "./play-songs-button";
import { usePlayer } from "./player-provider";

/**
 * The album header's transport, measured from music.apple.com's album page: a
 * 36px shuffle circle beside the 130px Play pill, 12px apart. Shuffle does
 * what Apple's button does — switch the mode on and start the album from a
 * random track — rather than only toggling the mode.
 */
export function AlbumActions({ album }: { album: Album }) {
  const { shuffle, toggleShuffle, play } = usePlayer();

  const startShuffled = () => {
    if (!shuffle) toggleShuffle();
    const { tracks } = album;
    if (tracks.length === 0) return;
    play(tracks[Math.floor(Math.random() * tracks.length)], album);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={startShuffled}
        aria-label="Shuffle play"
        aria-pressed={shuffle}
        title="Shuffle"
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--dz-control-bg) text-(--dz-text-label) transition-colors hover:bg-(--dz-control-bg-hover)"
      >
        <IconShuffle className="h-4 w-4" />
      </button>
      <PlaySongsButton songs={album.tracks} album={album} variant="pill" />
    </div>
  );
}
