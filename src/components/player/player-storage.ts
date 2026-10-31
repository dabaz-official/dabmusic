import type { Album } from "@/lib/types";

import type { RepeatMode } from "./player-provider";

/**
 * Versioned key so a future shape change can ship beside the old one instead
 * of reading a half-matching blob. Bump the suffix when `PersistedPlayerState`
 * changes incompatibly; an unknown version is treated as "nothing stored".
 */
export const PLAYER_STORAGE_KEY = "dabmusic.player.v1";

/** Everything the player needs to come back where the listener left it. */
export interface PersistedPlayerState {
  version: 1;
  /**
   * The whole album, not just an id: `Album` is plain JSON (see
   * `src/lib/types.ts`) and only a few KB, so the client can rebuild the queue
   * without a server round-trip on every cold start.
   */
  album: Album;
  index: number;
  /** Playback position in seconds; applied once the audio has metadata. */
  position: number;
  /** 0..1 */
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  /**
   * Shuffle bookkeeping, as queue indices. Without it a reload would restart
   * the shuffle cycle and "previous" would forget where it came from.
   */
  played: number[];
  history: number[];
}

function isRepeatMode(value: unknown): value is RepeatMode {
  return value === "off" || value === "all" || value === "one";
}

function isAlbum(value: unknown): value is Album {
  if (typeof value !== "object" || value === null) return false;
  const album = value as Partial<Album>;
  return (
    typeof album.id === "string" &&
    typeof album.title === "string" &&
    typeof album.artist === "string" &&
    Array.isArray(album.tracks) &&
    album.tracks.length > 0 &&
    album.tracks.every(
      (track) => typeof track?.id === "string" && typeof track?.src === "string",
    )
  );
}

function clampIndex(value: unknown, length: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value >= length) return null;
  return value;
}

function readIndices(value: unknown, length: number): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is number => clampIndex(item, length) !== null,
  );
}

/**
 * Returns the stored state, or `null` when there is nothing usable — absent,
 * unparseable, from another version, or shaped in a way we no longer trust.
 * Call it from an effect only: reading storage during render breaks hydration.
 */
export function readPlayerState(): PersistedPlayerState | null {
  if (typeof window === "undefined") return null;

  let parsed: unknown;
  try {
    const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const state = parsed as Partial<PersistedPlayerState>;
  if (state.version !== 1 || !isAlbum(state.album)) return null;

  const index = clampIndex(state.index, state.album.tracks.length);
  if (index === null) return null;

  const position =
    typeof state.position === "number" && Number.isFinite(state.position)
      ? Math.max(0, state.position)
      : 0;
  const volume =
    typeof state.volume === "number" && Number.isFinite(state.volume)
      ? Math.min(1, Math.max(0, state.volume))
      : 1;

  return {
    version: 1,
    album: state.album,
    index,
    position,
    volume,
    shuffle: state.shuffle === true,
    repeat: isRepeatMode(state.repeat) ? state.repeat : "off",
    played: readIndices(state.played, state.album.tracks.length),
    history: readIndices(state.history, state.album.tracks.length),
  };
}

/** Best-effort write: private mode and a full quota both just drop it. */
export function writePlayerState(state: PersistedPlayerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Nothing to do — the player keeps working, it just won't survive a reload.
  }
}
