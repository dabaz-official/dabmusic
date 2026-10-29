"use client";

import { ExplicitBadge } from "@/components/explicit-badge";
import { formatTime } from "@/lib/format";
import type { Album } from "@/lib/types";

import { PlayPauseIcon } from "./player-icons";
import { usePlayer } from "./player-provider";

/**
 * The album's tracks on Apple's web album page measurements: 46px rows with no
 * separators, a 40px number column with the number centred in it, 13px type,
 * the duration on the right and a 6% wash on hover. A row is one button — it
 * starts the album from that track, or toggles playback when it is the current
 * one — and the number gives way to a play glyph on hover.
 *
 * The hover wash runs one gutter wider than the text on each side: the list
 * cancels the page's horizontal padding and every row puts it back as its own
 * padding, so the highlight starts and ends where the content's spacing does
 * while the type stays exactly where it was.
 */
export function TrackList({ album }: { album: Album }) {
  const { currentSong, isPlaying, play, togglePlay } = usePlayer();

  return (
    <ol className="[margin-inline:calc(var(--dz-gutter)*-1)]">
      {album.tracks.map((song) => {
        const active = song.id === currentSong?.id;
        const rowPlaying = active && isPlaying;
        return (
          <li key={song.id}>
            <button
              type="button"
              onClick={() => (active ? togglePlay() : play(song, album))}
              aria-label={`${rowPlaying ? "Pause" : "Play"} ${song.title}`}
              className="group flex h-[46px] w-full cursor-pointer items-center rounded-sm px-(--dz-gutter) text-left transition-colors hover:bg-(--dz-row-hover)"
            >
              {/* Phones: the number's own left edge sits on the page gutter —
                  the same x as the player pill's left side — and the title
                  follows it, so the row reads flush with the player. From
                  `lg` up the column widens to Apple's 40px and the number is
                  centred in it, exactly as on their album page. */}
              <span className="flex w-7 shrink-0 items-center justify-start lg:w-10 lg:justify-center">
                {active ? (
                  <PlayPauseIcon
                    playing={rowPlaying}
                    className="h-4 w-auto text-(--dz-text-label)"
                  />
                ) : (
                  <>
                    <span className="text-[13px] tabular-nums text-(--dz-text-muted) group-hover:hidden">
                      {song.trackNumber}
                    </span>
                    <PlayPauseIcon
                      playing={false}
                      className="hidden h-4 w-auto text-(--dz-text-label) group-hover:block"
                    />
                  </>
                )}
              </span>
              {/* Title and explicit mark travel together; the row's free
                  space sits after them, not between. */}
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span
                  className={`truncate text-[13px] leading-4 text-(--dz-text-label) ${
                    active ? "font-semibold" : "font-normal"
                  }`}
                >
                  {song.title}
                </span>
                {/* 9px, Apple's own row badge — their glyph fills the box. */}
                {song.explicit && <ExplicitBadge className="h-[9px] w-[9px]" />}
              </span>
              <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-(--dz-text-muted)">
                {song.duration > 0 ? formatTime(song.duration) : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
