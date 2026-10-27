# Rebuild progress

Branch `rebuild`, started from `main` @ `ba35c61`. As of `0125fcc`
(2026-10-27) the shell, library, home page and the player's first two cuts are
in place; lyrics, the full-screen player and the PWA work remain.

## Why a rebuild

The previous implementation worked, but it had grown into a single 1200-line
player component with duplicated playback surfaces and two copies of the lyrics
list. Rather than keep patching it, this branch starts over on a fresh scaffold.

The old tree is untouched on `main`, so nothing is lost.

## Reference material

UI decisions are checked against **music.apple.com's own computed styles**
rather than guessed. Measured recipes are kept in
`~/.zcode/.../memory/apple-music-material-reference.md` and summarised here:

- Materials are always **blur + saturate**, never plain blur — plain blur
  averages a tint toward grey, `saturate()` keeps it rich.
- Persistent bars: `blur(16px) saturate(2.2)` over a 60% wash
  (`rgba(38,38,40,0.6)` in their dark theme — our `surface-secondary/60`).
- Transient popups: `blur(60px) saturate(2)` at 60%.
- Separators are sub-pixel hairlines: `0.75px rgba(255,255,255,0.05)` in dark,
  black at ~6% in light.
- Their **web** album pages have no separators between track rows at all — the
  rules we used to draw come from the native macOS app.

## Done

### Foundation

- [x] Branch `rebuild` created from `main` (`ba35c61`); the previous
      implementation removed (55 files: all of `src/`, the configs,
      `components.json`, icons, service worker). `public/music` kept (79 files,
      223 MB — content, not code, URLs unchanged).
- [x] Scaffold: Next.js 16.4.3 (App Router, `src/`, `@/*` alias), React 19.3.1,
      Tailwind 4.3.3 via `@tailwindcss/turbopack`, TypeScript 6.0.3, ESLint
      10.13 + `eslint-config-next` 16.4.3, `@types/node` 24.19.2. TypeScript 7
      and `@types/node` 26 held back deliberately. Cache Components and Partial
      Prefetching on (scaffold defaults).
- [x] Typography: Inter Variable vendored in `src/app/fonts/` through
      `next/font/local`; CJK is **Noto Sans SC** (owner decision), variable
      wght 100–900 chunked into unicode-range slices by the DabFonts pipeline
      (827 `@font-face` rules in `src/app/fonts/noto-sans-sc.css`, chunks in
      `public/fonts/noto-sans-sc/`). All Chinese punctuation is baked at half
      width, and Inter's glyphs are shifted for optical centring against Noto.
- [x] Design foundation: 14 neutral primitives + semantic tokens (background /
      surface / text / border) with light and dark mappings, functional colours
      (OD-001, approved 2026-10-24), the ink accent mapping (OD-003),
      `next-themes` class switching, and the `/design` Foundation Test Page with
      computed WCAG contrast tables. Accent and text colours are unchanged since.
- [x] App metadata: `DabMusic`, `%s | DabMusic` template, `metadataBase`,
      description `I AM MUSIC.`, and the owner's `public/favicon.png` (512px)
      wired through the root `icons` field.

### Shell

- [x] Route group `src/app/(site)/` renders the chrome so `/design` stays
      outside it. Below 640px the chrome is a sticky top bar (logo optically
      centred, Menu button on the right); from 640px up it is a fixed sidebar
      whose width ramps from **180px at 640px to 280px at 770px** and holds
      (`--dz-sidebar-width`, shared with the content offset).
      `position: fixed`, not sticky — sticky produced a one-time upward nudge at
      the very bottom of the page.
- [x] Sidebar internals: 36px horizontal / 40px top inset, nav links with
      `usePathname` active detection (semibold + translucent wash), logo at
      20px height, icons 16px so they stay smaller than the logo's D mark.
      The whole UI uses exactly two weights: **semibold (600) for emphasis,
      regular (400) for everything else**.
- [x] Content column: always left-aligned, gutters 30px below 640px and 32px
      above, **no max-width cap**, vertical margins equal to the horizontal
      gutters.
- [x] Mobile menu: portalled to `<body>` (a descendant of the blurred top bar
      cannot sample the page backdrop — it would render flat), grows downward
      from under the header with a CSS height transition, locks body scroll,
      closes on navigation. The top bar drops its bottom hairline while the
      menu is open.
- [x] Materials (all measured from Apple Music, light and dark both): bars use
      `bg-surface-secondary/60` + `blur(16px) saturate(2.2)`; edges are
      `0.75px` hairlines (`--dz-hairline`: white 5% dark / black 6% light);
      active nav rows use `--dz-nav-active` (white 10% dark / black 6% light)
      instead of an opaque surface.

### Library

- [x] Every album folder under `public/music/` carries an `album.json`
      (`title`, `artist`, `explicit`, optional `releaseDate`, display `order`,
      `section`, and a track list with optional per-track `explicit` / `artist`
      / `cover` overrides and `.lrc` reference). A song's `artist` and `cover`
      resolve as `song.artist ?? album.artist` / `song.cover ?? album.cover`.
      Covers are auto-detected, not declared.
- [x] `src/lib/library.ts` (server-only) scans the folders and validates
      strictly: a missing `album.json`, cover, empty track list, unknown
      `section`, or a missing track / lyrics / per-track cover file fails the
      build; audio not listed in `album.json` only warns. Exposes `getAlbums()`
      / `getAlbum(id)` / `getAllSongs()`, with client-safe `Album` / `Song`
      types in `src/lib/types.ts`.
- [x] Home sections: albums are grouped by `section` into **Unreleased** (9)
      and **Released** (8); the field lives in `album.json`, so moving an album
      is a one-word edit.
- [x] Waveforms: `pnpm gen:waveforms` decodes every mp3 with a wasm mpg123 (no
      ffmpeg) and writes `<stem>.waveform.json` next to the audio — 400
      normalised peaks each, ~2.4KB per track, 47 files committed. The scanner
      attaches the URL as `Song.waveform`.
- [x] Cover colours: `pnpm gen:colors` quantises each cover with sharp, scores
      buckets by `count × saturation` (skipping near-black/near-white), and
      writes `cover.color.json` with an OKLCH-clamped dark tint and light tint.
      Grey covers degrade gracefully to a neutral wash. Attached as
      `Album.colors`.

### Pages

- [x] Home: 40px semibold "Home" title whose cap height is optically level with
      the sidebar logo (compensating the line box), then the two section
      headings and grids. Grid columns step **2 → 3 → 4 → 5 → 6** at
      **720 / 890 / 1260 / 1600px**; covers via `next/image` with per-breakpoint
      `sizes`; card text is 12px throughout with the explicit mark sized to the
      rendered cap height (9px) and pinned to the right edge of the title row.
- [x] Album pages: `/album/[id]` with `generateStaticParams` (all 17
      prerendered) and `generateMetadata` (title, description, OG cover).
      `params` resolves inside `<Suspense>` per the Cache Components guide.
      Header shows cover, title, artist and track count; the track list is
      playable. The page background is a **full-viewport fixed layer** of the
      cover-derived tint (no gradient), with standard text tokens on top, so
      contrast is untouched; the sidebar turns translucent over it.
- [x] Cover corner radius: 8px on grid cards, 12px on album headers.

### Player (cuts 1 and 2)

- [x] `PlayerProvider` is the single client boundary, mounted in the root
      layout so one `<audio>` element survives navigation. It owns the queue
      (playing a song makes its album the queue), shuffle (random other track),
      repeat (off → all → one; repeat-one loops on the element so `ended` never
      fires), volume, and now-playing state. Sync is derived from the element's
      own events rather than mirrored.
- [x] Mini bar: a floating pill (16px insets, `max-w-4xl`, fully rounded) with
      the owner's icon set, a **spinning round cover** bound to playback
      position (angle = `currentTime × 12°`, so seeking forward or back spins it
      accordingly), fixed-width track info (fits "LOVE GOT ME NUMB"), the
      waveform seek, and transport with shuffle / previous / play-pause / next /
      repeat / volume.
- [x] Waveform seek (`wave-form-seek.tsx`): canvas bars, played portion in the
      primary text colour, click-drag seek with pointer capture, keyboard
      arrows / Home / End, `role="slider"` semantics, redraw on resize and theme
      change, and a plain-line fallback if peaks are missing.
- [x] Volume popup: centred above the bar, vertical custom slider, Apple's
      measured popup material (`blur(60px) saturate(2)` at 60%), closes on
      outside click or Escape, icon dims at zero.
- [x] Keyboard: **Space** toggles playback globally, skipped while focus is in a
      field or on a button/link (that would double-fire) and while repeating.
- [x] All six transport icons sit in identical 28px boxes with one uniform gap
      (32px centre-to-centre), verified by measurement.

### Lyrics and the full-screen player

- [x] Track durations: `music-metadata` parses every file at build time behind a
      per-path cache (`Song.duration`); the album page shows per-track times and
      a total runtime. An unreadable file yields 0 rather than failing a build.
- [x] Lyrics: `src/lib/lrc.ts` (restored from `5f9ccb3`) parses plain,
      multi-timestamp and `>> lead | echo` duet lines; `lyrics-view.tsx` fetches
      per URL into a module cache, highlights the active line with a short lead,
      follows it with smooth scrolling that yields to manual scrolling, and
      honours `prefers-reduced-motion`. Centring is computed from rects, not
      `offsetTop`, so it is independent of the positioned shell.
- [x] Full-screen player (`fullscreen-player.tsx`), laid out after
      music.apple.com: close button top-left, artwork + title + transport in the
      left column, lyrics in the right, backdrop is the cover itself blown up,
      blurred and dimmed. All state comes from the existing provider, so the
      mini bar and the full-screen view share one `<audio>` element.
- [x] motion (`motion@14.6.0`) enters the stack here: `AnimatePresence` drives
      the open/close transition, the panels stagger in, and
      `useReducedMotion()` collapses all of it to plain fades.
- [x] Mini bar: the cover + title is now the trigger for the full-screen view;
      the volume popup, shuffle/repeat, space shortcut and vinyl spin all carry
      over. The album page play button is a fixed-width pill that shares the
      play/pause slot.

- [x] Media Session (`use-media-session.ts`): the OS media UI gets title,
      artist, album and an absolute artwork URL with its real MIME type;
      `playbackState` mirrors playback in both directions; position state keeps
      the system scrubber in sync; and play / pause / next / previous / seekto /
      seek-backward / seek-forward are wired to the same handlers the UI uses.
      Every call is capability-guarded — an unsupported API is skipped, never
      thrown.

- [x] Sidebar matched to music.apple.com (desktop): 260px wide (`--dz-sidebar-width`
      caps there), `rgb(38 38 40 / 0.6)` wash over `blur(16px) saturate(2.2)`
      always on, 20/12px horizontal padding, and nav rows that reproduce their
      markup — 36px tall with a 4px bottom margin, 7px inline padding, 24px
      icons with a 4px gap, one text colour (`--dz-nav-text`, 92%) for every
      row, selection shown only by an 8% wash (`--dz-nav-active`). The active
      row is no longer semibold: Apple keeps every label at 400.

### Desktop polish (owner-driven, measured against music.apple.com)

- [x] Shell breakpoint moved to **484px** (Apple's own: sidebar replaces the
      top bar there), as a dedicated `--breakpoint-shell` so unrelated `sm:`
      layouts keep their scale. Sidebar width still ramps 180 → 260px.
- [x] Sidebar internals copied from Apple's measured markup: 20/12px
      horizontal padding, logo padded 7px so its left edge matches the nav
      icons', rows 36px tall with a 4px bottom margin, 24px icons, one 92%
      label colour, 8% wash for the active row (no bold).
- [x] Home page: headings at Apple's metrics (page title 34/40 bold, section
      17/22 bold), cards 12/15 with 92% / 64% label colours, explicit mark
      10px, cover radius 7px, 5px cover-to-title gap.
- [x] Album rows became **horizontal shelfs** instead of wrapping grids, after
      Apple's "最近播放": one scrolling row, fixed 144px cards with 10px gaps
      below 1024px, then a fluid width of `(content − (N−1)·gap) / (N + 0.35)`
      with 20px gaps, showing 4 / 5 / 6 full cards plus a sliver from 1024 /
      1281 / 1601px. Hidden scrollbar, scroll-snap. (The shelf uses
      flex longhands — the `flex` shorthand silently reset flex-basis and
      defeated the breakpoints.)
- [x] Play/pause glyph: pause is dead-centre; play carries Apple's own
      proportional offset (7.55% of its ink width) so the two read as
      optically aligned without either moving on toggle.

- [x] Footer (`site-footer.tsx`), modelled on music.apple.com's: a band in
      its own shade — `rgb(50 50 50)` dark, `#f5f5f5` light (`--dz-footer-bg`)
      — with the copyright line at 64% and links at 92%, both 11px; 14px above
      the copyright, 5px between the lines and 90px below them, which is also
      the room the floating player needs, so the band reaches the page bottom.
      40px is the minimum gap above it, and `flex-1` on `<main>` keeps the
      footer at the bottom of the viewport when a page is short. Links
      underline on hover without changing colour, exactly like Apple's. The
      link row holds a single Feedback link to the repository's issue tracker;
      Apple's terms / privacy / cookie pages have no counterpart here.

## Reverted, rebuilt in smaller steps

The first attempt at the player, durations, lyrics and full-screen player was
built and verified as `5f9ccb3`, then backed out (`4b4b1ee`) to be restarted in
reviewable cuts. The player core has since been rebuilt from scratch as cuts 1
and 2 above; `5f9ccb3` remains the reference for the lyrics parser, the
Media Session hook and the full-screen layout, which are still to come.

## Verified

| Check | Result |
| --- | --- |
| `pnpm lint` / `pnpm build` | clean; all 17 album pages prerendered |
| Shelves | horizontal rows: 4 / 5 / 6 full cards at 1024 / 1281 / 1601px, ~1/4 card peeking |
| Shell | top bar ≤483px, sidebar from 484px; width ramps 180 → 260px (capped); logo stable at the page bottom |
| Home title | 34/40 bold, "H" cap top optically level with the logo top |
| Mobile menu | grows to full height, blurs the page behind (portal), links navigate and close it |
| Materials | bars and menu at `surface-secondary/60` + `blur(16px) saturate(2.2)`; edges 0.75px hairline |
| Explicit mark | owner's SVG via `currentColor`; 10px on cards, 9px in track rows, 16px beside the album title |
| Playback | audio plays, survives navigation, queue/next/previous behave; shuffle and all three repeat modes cycle correctly |
| Waveform | clicks seek to the exact position; drag and keyboard both work |
| Vinyl | angle tracks `currentTime × 12°`; seeking back spins it counter-clockwise |
| Volume | real pointer drag sets `audio.volume`; outside click and Escape close the popup |
| Space | toggles play/pause, skipped on focused buttons and in text fields |
| Cover tint | dark red on Deep Voice, olive on Come Again, neutral on grey covers; light theme gets the pale tint |
| Footer | band 140px tall, 40px minimum gap above, anchored to the bottom of the viewport on short pages |
| Media Session | metadata + artwork set, `playbackState` follows both directions |

## Remaining

Phase ordering follows `docs/development-plan.md`; the phases that shipped are
recorded under **Done** above.

### Mobile polish

- Mini bar below `md` (768px): the waveform and transport are hidden today —
  decide what a compact bar shows (cover + title + play/pause is the minimum).
- Mobile menu (below 484px): add the theme toggle — there is no way to switch
  theme at that size right now — and decide whether it lists anything else.
- Album header at 375px: the 232px cover dominates the viewport.

### PWA and metadata

- `manifest.ts` with the owner's icons (`public/favicon.png` is 512px;
  `public/apple-icon.png` is committed but **not wired** — move it to
  `src/app/apple-icon.png` or declare it in metadata).
- Service worker: cache the app shell and the artwork, **never the audio**
  (223 MB, and range requests break with naive caching).
- `sitemap.ts` and `robots.txt`.
- Generated per-album OG images (`opengraph-image`) using the cover and its
  derived tint.

### Deploy and merge

- Vercel preview; verify audio streaming and `next/image` optimisation on the
  real domain.
- Merge `rebuild` into `main` (one commit per section, so a clean merge or a
  squash both read well), then delete the branch and `backup-pre-squash`.

### Loose ends worth scheduling

- **Queue view**: `IconQueue` is in the icon set but unused — a "Play next /
  add to queue" affordance and a queue panel would complete the queue work.
- **Volume persistence**: the level resets on reload; persisting it (and
  shuffle / repeat) is a few lines in `localStorage`.
- **Search**: 17 albums fit in two shelves, so this is not urgent, but it is
  the obvious next feature once the catalogue grows.
- **`docs/development-plan.md`** still describes the original eight phases;
  fold the remaining ones into it as they land, then retire this file's
  Remaining section.
- **History/runtime**: an older machine may carry unpushed commits based on
  `8fcb2ce`; pull with `--rebase` before pushing there.

## Resolved decisions

1. **Functional colours** — approved values for `success`, `warning`, `danger`,
   `focus` and `selection` live in `core-template.md` §4.3 (closes OD-001; the
   core doc itself still says "Proposed" and should be updated by its owner).
2. **The "now playing" accent** — the DabMusic accent is the gray ramp ("ink"),
   per `core-template.md` OD-003. No hue is introduced.
3. **Owner overrides of `design.md`** — the container has no max-width cap and
   its gutters are 30/32px (spec says 1200px max, 16/24/32px); spacing is locked
   rather than fluid at most breakpoints; per-album cover colours are a
   deliberate addition outside the neutral palette (DabMusic is treated as an
   independent product that may later split from the DabAZ system).

## Working notes

- Next 16 differs from older knowledge. `AGENTS.md` points at the versioned docs
  in `node_modules/next/dist/docs/`; read them before writing framework code.
- Cache Components: uncached async data blocks prerendering. `params` resolves
  inside `<Suspense>`; data helpers may need `"use cache"`.
- Turbopack on this Windows setup serves stale CSS after editing `globals.css`
  (or utility definitions) until `.next` is removed and the dev server
  restarted. A build that fails with a Turbopack child-process error is the same
  class of problem — wipe `.next`.
- Shell commands need the 127.0.0.1:7897 proxy for network access.
- Chinese copy follows the punctuation rule in `AGENTS.md`: halfwidth forms with
  a trailing space.
