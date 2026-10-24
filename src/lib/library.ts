import "server-only";

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

import type { Album, Song } from "@/lib/types";

const MUSIC_ROOT = join(process.cwd(), "public", "music");

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
  explicit?: boolean;
  lrc?: string;
}

interface AlbumManifest {
  order?: number;
  title: string;
  artist: string;
  explicit?: boolean;
  releaseDate?: string;
  tracks: TrackManifest[];
}

function stripExtension(file: string): string {
  return file.slice(0, file.length - extname(file).length);
}

function scanAlbum(
  id: string,
): { album: Album; order: number } {
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

  const albumExplicit = manifest.explicit ?? false;
  const tracks = manifest.tracks.map((track, index): Song => {
    if (!files.has(track.file)) {
      fail(`track file ${track.file} does not exist`);
    }
    if (track.lrc !== undefined && !files.has(track.lrc)) {
      fail(`lyrics file ${track.lrc} does not exist`);
    }
    return {
      id: `${id}/${stripExtension(track.file)}`,
      albumId: id,
      trackNumber: index + 1,
      title: track.title,
      artist: manifest.artist,
      src: `/music/${id}/${track.file}`,
      cover: `/music/${id}/${cover}`,
      explicit: track.explicit ?? albumExplicit,
      lyrics: track.lrc === undefined ? undefined : `/music/${id}/${track.lrc}`,
    };
  });

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
      tracks,
    },
    order: manifest.order ?? Number.POSITIVE_INFINITY,
  };
}

/**
 * Scans `public/music/*` and merges every album.json into typed data.
 * Runs on each call — cheap at this scale, and `next dev` picks up newly
 * dropped albums without a restart.
 */
export function getAlbums(): Album[] {
  if (!existsSync(MUSIC_ROOT)) {
    throw new Error(`music library not found at ${MUSIC_ROOT}`);
  }

  const scanned = readdirSync(MUSIC_ROOT)
    .filter((name) => statSync(join(MUSIC_ROOT, name)).isDirectory())
    .map((id) => scanAlbum(id));

  return scanned
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.album.id.localeCompare(b.album.id);
    })
    .map((entry) => entry.album);
}

export function getAlbum(id: string): Album | undefined {
  return getAlbums().find((album) => album.id === id);
}

export function getAllSongs(): Song[] {
  return getAlbums().flatMap((album) => album.tracks);
}
