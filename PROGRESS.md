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

`LOVE GOT ME NUMB` is converted to `.dmll`. Its word timings were estimated
from the old line-level LRC and should be refined by ear.

## Recently completed

- DMLL parser, types, `album.json` `dmll` field, and `.dmll` service-worker
  caching.
- Word-level mask sweep, per-word lift and hover treatment.
- `LOVE GOT ME NUMB` converted from `.lrc` to `.dmll`; the old line-level file
  remains recoverable from git history.
- Player state persistence and the shuffle queue.
- Line-level lyrics added for the remaining Deep Voice and If Looks Could Kill
  tracks.
- DMLL documentation and the line-level LRC extension notes.

## Next

- Migrate the remaining 32 `.lrc` files to DMLL when their word timing is
  ready; the format already reads them unchanged in the meantime.
- Refine the estimated word timings in `LOVE GOT ME NUMB`.
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
