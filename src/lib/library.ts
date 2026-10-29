import "server-only";

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import { parseFile } from "music-metadata";

import type { Album, AlbumSection, Song } from "@/lib/types";

const MUSIC_ROOT = join(process.cwd(), "public", "music");

/** Durations per absolute path, so repeated scans skip re-parsing. */
const durationCache = new Map<string, number>();

/** A file that cannot be parsed yields 0 — a bad rip must not fail a build. */
async function readDuration(file: string): Promise<number> {
  const cached = durationCache.get(file);
  if (cached !== undefined) return cached;

  try {
    const { format } = await parseFile(file);
    const seconds = Number.isFinite(format.duration) ? (format.duration ?? 0) : 0;
    durationCache.set(file, seconds);
    return seconds;
  } catch {
    durationCache.set(file, 0);
    return 0;
  }
}

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".m4a",
  ".flac",
  ".wav",
  ".ogg",
  ".opus",
]);
const COVER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

interface TrackManifest {
  file: string;
  title: string;
  /** Per-track overrides — absent fields fall back to the album's values. */
  artist?: string;
  /**
   * The track's own number in its release. Only for albums that carry a
   * handful of tracks lifted out of a longer record, where the list position
   * would misnumber them; everything else is numbered by position.
   */
  number?: number;
  cover?: string;
  explicit?: boolean;
  lrc?: string;
}

interface AlbumManifest {
  order?: number;
  title: string;
  artist: string;
  explicit?: boolean;
  releaseDate?: string;
  section?: string;
  tracks: TrackManifest[];
}

const SECTIONS = new Set<AlbumSection>(["unreleased", "released"]);

function stripExtension(file: string): string {
  return file.slice(0, file.length - extname(file).length);
}

async function scanAlbum(
  id: string,
): Promise<{ album: Album; order: number }> {
  const dir = join(MUSIC_ROOT, id);
  const fail = (message: string): never => {
    throw new Error(`album ${id}: ${message}`);
  };

  const files = new Set(readdirSync(dir));
  if (!files.has("album.json")) {
    fail("album.json is missing");
  }

  let manifest: AlbumManifest;
  try {
    manifest = JSON.parse(
      readFileSync(join(dir, "album.json"), "utf8"),
    ) as AlbumManifest;
  } catch (error) {
    throw new Error(`album ${id}: album.json is not valid JSON`, { cause: error });
  }

  const cover = COVER_EXTENSIONS.map((ext) => `cover${ext}`).find((name) =>
    files.has(name),
  );
  if (!cover) {
    fail(`no cover.* found (tried ${COVER_EXTENSIONS.join(", ")})`);
  }
  if (manifest.tracks.length === 0) {
    fail("album.json lists no tracks");
  }

  let section: AlbumSection = "released";
  if (manifest.section !== undefined) {
    if (!SECTIONS.has(manifest.section as AlbumSection)) {
      fail(`unknown section ${manifest.section} (expected unreleased or released)`);
    }
    section = manifest.section as AlbumSection;
  }

  let tint: Album["tint"];
  if (files.has("cover.color.json")) {
    try {
      tint = JSON.parse(
        readFileSync(join(dir, "cover.color.json"), "utf8"),
      ) as { color: string; mode: "light" | "dark" };
    } catch {
      // A broken color file just means no tint.
      tint = undefined;
    }
  }

  const albumExplicit = manifest.explicit ?? false;
  const tracks: Song[] = [];
  for (const [index, track] of manifest.tracks.entries()) {
    if (!files.has(track.file)) {
      fail(`track file ${track.file} does not exist`);
    }
    if (track.lrc !== undefined && !files.has(track.lrc)) {
      fail(`lyrics file ${track.lrc} does not exist`);
    }
    if (track.cover !== undefined && !files.has(track.cover)) {
      fail(`cover file ${track.cover} does not exist`);
    }
    tracks.push({
      id: `${id}/${stripExtension(track.file)}`,
      albumId: id,
      trackNumber: track.number ?? index + 1,
      title: track.title,
      artist: track.artist,
      src: `/music/${id}/${track.file}`,
      cover:
        track.cover === undefined ? undefined : `/music/${id}/${track.cover}`,
      explicit: track.explicit ?? albumExplicit,
      lyrics: track.lrc === undefined ? undefined : `/music/${id}/${track.lrc}`,
      waveform: files.has(`${stripExtension(track.file)}.waveform.json`)
        ? `/music/${id}/${stripExtension(track.file)}.waveform.json`
        : undefined,
      duration: await readDuration(join(dir, track.file)),
    });
  }

  const listed = new Set(manifest.tracks.map((track) => track.file));
  for (const file of files) {
    if (AUDIO_EXTENSIONS.has(extname(file)) && !listed.has(file)) {
      console.warn(`album ${id}: audio file ${file} is not listed in album.json`);
    }
  }

  return {
    album: {
      id,
      title: manifest.title,
      artist: manifest.artist,
      cover: `/music/${id}/${cover}`,
      explicit: albumExplicit,
      releaseDate: manifest.releaseDate,
      section,
      tint,
      tracks,
    },
    order: manifest.order ?? Number.POSITIVE_INFINITY,
  };
}

/**
 * Scans `public/music/*` and merges every album.json into typed data.
 * Cached with `use cache` so prerendering under Cache Components stays
 * static; durations are cached per file, so re-runs are cheap. Newly dropped
 * albums need a dev-server restart (or a new build) to appear.
 */
export async function getAlbums(): Promise<Album[]> {
  "use cache";
  if (!existsSync(MUSIC_ROOT)) {
    throw new Error(`music library not found at ${MUSIC_ROOT}`);
  }

  const scanned = await Promise.all(
    readdirSync(MUSIC_ROOT)
      .filter((name) => statSync(join(MUSIC_ROOT, name)).isDirectory())
      .map((id) => scanAlbum(id)),
  );

  return scanned
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.album.id.localeCompare(b.album.id);
    })
    .map((entry) => entry.album);
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  return (await getAlbums()).find((album) => album.id === id);
}

export async function getAllSongs(): Promise<Song[]> {
  return (await getAlbums()).flatMap((album) => album.tracks);
}

/**
 * Newest first, for the home page's 最新发行 row — Apple orders that row by
 * release date, not by whatever sequence the manifests were written in. Dates
 * are ISO (`YYYY-MM-DD`), so a string compare is enough; anything without one
 * sinks to the end and keeps its manifest order there (`Array#sort` is stable).
 */
export function byReleaseDateDesc(a: Album, b: Album): number {
  if (a.releaseDate === b.releaseDate) return 0;
  if (a.releaseDate === undefined) return 1;
  if (b.releaseDate === undefined) return -1;
  return a.releaseDate < b.releaseDate ? 1 : -1;
}
