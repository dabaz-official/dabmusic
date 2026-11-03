# DabMusic — Progress

Last updated: 2026-11-03

DabMusic is a static music site and player for a fixed catalogue. There is no
account system: albums, audio and artwork live under `public/music/`, and the
site is prerendered from that folder.

## Current state

- Next.js 16 App Router, React 19, TypeScript and Tailwind 4.
- A server-side scan (`src/lib/library.ts`) turns each `album.json` into typed
  albums and tracks; missing covers, audio or lyric files fail the build.
- Home shelves for **Unreleased** and **Released**, album pages, the `/dabaz`
  artist view, and the `/design` foundation page.
- One client `PlayerProvider` owns the single `<audio>` element, the mini bar,
  the full-screen player and the queue. Playback state, volume, shuffle and
  repeat survive reloads.
- PWA manifest, service worker, sitemap, robots and per-album Open Graph
  images.
- 16 albums, 46 tracks, and lyrics for 33 tracks.

## Lyrics: DMLL

Lyrics are moving to **DMLL** (DabMusic Lyric Language), a line-oriented LRC
superset. The full specification is in [docs/dmll-format.md](./docs/dmll-format.md).

- `[v:left]` / `[v:right]` switch the side for a block of lines.
- `[ad:mm:ss.xx]` attaches an ad-lib to the previous lyric line.
- `{mm:ss.xx~mm:ss.xx}` gives a word its own start and end time.
- Word timing is optional per line; plain LRC lines still highlight normally.
- No XML, translations, romanisation, ruby/furigana, song sections or named
  singers.

The current full-screen lyric view:

- follows the current line and yields to manual scrolling for a few seconds;
- sweeps a bright mask across the current line's words;
- lifts each word by 2px as its own time arrives;
- keeps ad-libs dim until their time, and only while their parent line is
  current;
- brightens non-current lines on hover without removing their blur;
- collapses the sweep to the ordinary line-level highlight under
  `prefers-reduced-motion`.

Every shipped lyric file is `.dmll`. `LOVE GOT ME NUMB` has hand-tuned word
timing; the other word-timed files carry timings estimated from their old
line-level LRC by `scripts/convert-lyrics-to-dmll.mjs` (`pnpm gen:dmll`) and
should be refined by ear. The 18 Genius texts that never had line timing are
text-only DMLL files.

## Recently completed

- All 32 `.lrc` files migrated to `.dmll`: estimated word timing, one token per
  word (one per character for CJK), and every parenthesised backing vocal moved
  onto its own `[ad:]` line. The old files remain recoverable from git history.
- DMLL parser, types, `album.json` `dmll` field, and `.dmll` service-worker
  caching.
- Word-level mask sweep, per-word lift and hover treatment.
- Player state persistence and the shuffle queue.
- DMLL documentation and the line-level LRC extension notes.

## Next

- Refine the estimated word timings by ear, starting with the tracks that have
  real word-level references.
- Give the 18 text-only files line timing before they can get word timing.
- Add a queue panel / "play next" affordance if the queue needs a visible
  surface.
- Add search once the catalogue outgrows the shelves.
- Verify the production deploy, audio streaming and PWA install on the real
  domain.

## Commands

```sh
pnpm dev       # local development
pnpm lint      # eslint
pnpm build     # production build
```

Generated assets:

```sh
pnpm gen:waveforms
pnpm gen:colors
pnpm gen:icons
```
