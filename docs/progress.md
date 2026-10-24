# Rebuild progress

Branch `rebuild`, started from `main` @ `ba35c61`.

## Why a rebuild

The previous implementation worked, but it had grown into a single 1200-line
player component with duplicated playback surfaces and two copies of the lyrics
list. Rather than keep patching it, this branch starts over on a fresh scaffold.

The old tree is untouched on `main` and in the `vibe` branch history, so nothing
is lost.

## Done

- [x] Branch `rebuild` created from `main` (`ba35c61`).
- [x] Previous implementation removed — 55 files: all of `src/`, the configs,
      `components.json`, the icons and the service worker.
- [x] `public/music` kept: 79 files, 223 MB. It is content, not code, and its URLs
      are unchanged (`/music/<album>/<file>`).
- [x] Fresh scaffold from `create-next-app@16.4.2 --empty`:
      - Next.js 16.4.3 — App Router, `src/` directory, `@/*` import alias
      - React 19.3.1
      - Tailwind CSS 4.3.3, loaded through `@tailwindcss/turbopack`
      - TypeScript 6.0.3, ESLint 10.13.0 + `eslint-config-next` 16.4.3 (flat config)
      - `@types/node` 24.19.2; TypeScript 7 and `@types/node` 26 are held back deliberately
      - Cache Components and Partial Prefetching enabled (scaffold defaults)
- [x] Design-spec typography: locally vendored Inter Variable in `src/app/fonts/`,
      wired through `next/font/local`. The owner decided on 2026-10-24 that CJK
      text uses **Noto Sans SC** (superseding both the spec's system-fallback
      default and the same-day Alibaba PuHuiTi 3.0 attempt): the variable font
      (wght 100-900) chunked into unicode-range slices by the DabFonts pipeline,
      served from `public/fonts/noto-sans-sc/` and declared in
      `src/app/fonts/noto-sans-sc.css`; system CJK fonts remain the last-resort
      fallback. All Chinese punctuation is baked at half width (0.5em) in the
      font, and Inter's glyphs are shifted up 0.0112em for optical vertical
      centring against Noto.
- [x] Library data layer: every album folder under `public/music/` carries an
      `album.json` (title, artist, explicit, optional `releaseDate` and display
      `order`, plus a track list with optional per-track `explicit` / `artist` /
      `cover` overrides and `.lrc` reference; a song's `artist` and `cover`
      resolve with `song.artist ?? album.artist` / `song.cover ?? album.cover`,
      which keeps featured artists and per-track artwork possible without
      duplicating album values on every song). Metadata migrated from the old
      `main` constant; covers are auto-detected and deliberately not written
      into the json.
      `src/lib/library.ts` (server-only) scans the folders on demand — strict
      validation fails the build on a missing album.json, missing cover, empty
      track list, or a missing track/lyrics file, while audio not listed in
      album.json only warns — and exposes `getAlbums()` / `getAlbum(id)` /
      `getAllSongs()` from `src/lib/library.ts`, with the client-safe `Album` /
      `Song` types in `src/lib/types.ts`. The placeholder home page renders the
      library count as an end-to-end check (17 albums).
- [x] App metadata: `DabMusic`, `%s | DabMusic` title template, `metadataBase`,
      description `I AM MUSIC.`
- [x] Dependencies aligned with `main` and updated: Next 16.4.3, React 19.3.1,
      TypeScript 6.0.3, ESLint 10.13.0, `@types/node` 24.19.2. TypeScript 7 and
      `@types/node` 26 are held back deliberately.
- [x] Design foundation: 14 neutral primitives and semantic tokens
      (background / surface / text / border) as CSS variables with light and
      dark mappings, functional colours from `core-template.md` §4.3 (approved
      by the owner on 2026-10-24, closing OD-001), the ink accent mapping
      (OD-003: the DabMusic accent is the gray ramp), `next-themes` class
      switching, and a `/design` Foundation Test Page with computed WCAG
      contrast tables for both themes.

## Verified

| Check | Result |
| --- | --- |
| `pnpm lint` | clean |
| `pnpm build` | clean; `/` and `/_not-found` prerendered |
| `pnpm dev` | serves 200 |
| Inter actually loaded | `document.fonts.check("16px inter")` → `true` |
| Music assets | `/music/all-that-remains/cover.jpg` and the mp3 both return 200 |

## Not done yet

- No route beyond the placeholder page and `/design`.
- No player and no lyrics.

## Resolved decisions

Both blockers from the design foundation were decided by the owner on
2026-10-24:

1. **Functional colours** — approved values for `success`, `warning`, `danger`,
   `focus` and `selection` live in `core-template.md` §4.3. This closes OD-001;
   the core doc itself still says "Proposed" and should be updated by its owner.
2. **The "now playing" accent** — the DabMusic accent is the gray ramp ("ink"),
   per `core-template.md` OD-003. No hue is introduced.
