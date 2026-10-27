/**
 * Library types shared between server and client code.
 * Scanning happens server-side only (src/lib/library.ts).
 */

/** Home-page grouping; albums without a section in album.json are "released". */
export type AlbumSection = "unreleased" | "released";

export interface Song {
  /** `<album id>/<track file without extension>` — unique and URL-safe. */
  id: string;
  albumId: string;
  /** 1-based position within the album's track list. */
  trackNumber: number;
  title: string;
  /** Per-song override; resolve with `song.artist ?? album.artist`. */
  artist?: string;
  /** Public URL of the audio file, e.g. `/music/bo-he-shui/bo-he-shui.mp3`. */
  src: string;
  /** Per-song cover override URL; resolve with `song.cover ?? album.cover`. */
  cover?: string;
  explicit: boolean;
  /** Public URL of the `.lrc` file when the track has one. */
  lyrics?: string;
  /** Public URL of the pre-computed waveform peaks, when generated. */
  waveform?: string;
  /** Duration in seconds, parsed from the file at build time; 0 if unknown. */
  duration: number;
}

export interface Album {
  /** The album's folder name under `public/music/`. */
  id: string;
  title: string;
  artist: string;
  /** Public URL of the cover image. */
  cover: string;
  explicit: boolean;
  releaseDate?: string;
  section: AlbumSection;
  /** Cover-derived page tint (Apple-Music style), when generated. */
  colors?: { dark: string; light: string };
  tracks: Song[];
}
