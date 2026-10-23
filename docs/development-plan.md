# Development plan

Ordering principle: **data first, then state, then UI**. The previous build grew
interface and state at the same time, which is what made it hard to reason about.

Each phase ends with `pnpm lint`, `pnpm build` and a real browser check, and gets
its own commit.

## 1. Design foundation

- Map the spec's 14 approved neutrals to CSS variables. Their hex values are
  identical to Tailwind's `neutral-*` scale, so no custom palette is needed.
- Add semantic tokens (background, surface, text, border) with light and dark
  mappings, `next-themes` class switching, and a no-flash inline script.
- Build the spec's Foundation Test Page at `/design`, outside the navigation:
  all 14 swatches, the type scale, spacing, radius, control sizes, and a contrast
  table with calculated ratios.
- Blocked on the two open colour decisions: functional colours, and the
  "now playing" accent.

## 2. Library data layer

Folder names are slugs (`bo-he-shui`) while display titles are Chinese
(`薄荷水`) and artists vary, so metadata cannot be derived from the filesystem.
Recommended shape: an `album.json` inside each folder, merged by a build-time
scan of `public/music/*` into typed `Album[]` / `Song[]`. Adding a song then
means "drop the files in a folder and edit a small json", not editing a large
constant.

## 3. Page skeleton

Header and album grid, server components only. Container, gutters and spacing
per the spec — 1200px max width, 16/24/32px gutters. Covers through `next/image`
with correct `sizes`.

## 4. Player core

The single client boundary: a provider mounted in the root layout that owns one
`<audio>` element. Play/pause, next/previous, seek, volume, repeat and shuffle;
state derived rather than mirrored; Media Session for lock-screen metadata.
Ship the mini bar first — it does not need to look finished.

## 5. Album page and queue

`album/[id]` with `generateMetadata` and `generateStaticParams`, track list and
total runtime. Settle what "play this album" means for the queue.

## 6. Lyrics

Parse LRC into a typed timeline — plain lines, multi-timestamp lines, and the
`>>` / `|` duet format. Render one memoised list and follow it with an rAF easing
loop that yields to manual scrolling and respects `prefers-reduced-motion`.

## 7. Full-screen player

Built once phases 4 and 6 have settled: cover and lyrics side by side on desktop,
the same pieces stacked on mobile.

## 8. PWA, metadata, deploy

Manifest, icons, and a service worker that caches the app shell but never the
audio. Per-album `opengraph-image`, a sitemap, a Vercel preview, then merge.

## Working notes

- Next 16 differs from older knowledge. `AGENTS.md` points at the versioned docs
  in `node_modules/next/dist/docs/`; read them before writing framework code.
- Do not invent colours outside the spec. Anything the spec marks as pending is a
  decision to raise, not a value to guess.
- Keep exactly one client boundary. Everything that is not the player should stay
  a server component.
