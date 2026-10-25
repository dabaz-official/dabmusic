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
- [x] Page skeleton, part 1 — the site header (`src/components/site-header.tsx`,
      server component, mounted in the root layout): full-bleed bar with a
      bottom border, `dz-container` utility in `globals.css` implementing the
      spec's container-xl (1200px max, 16/24/32px gutters by viewport), the
      "DabMusic" wordmark at heading-sm weight linking to `/`, and the existing
      theme toggle on the right. Verified with lint, build, and a browser pass
      at 375 / 800 / 1280px (computed gutters 16/24/32px, container capped at
      1200px, both themes). The album grid is still to come in this phase.
- [x] Page skeleton, part 2 — the owner rejected the top header in favour of a
      left sidebar: `src/components/site-sidebar.tsx` with the DabMusic logo
      on top and nav links below (Home, DabAZ), rendered by the
      `src/app/(site)/layout.tsx` route group so `/design` stays outside the
      site chrome per the phase-1 decision. `/dabaz` is a placeholder page.
- [x] Page skeleton, part 3 — layout locked by the owner (2026-10-25): the
      sidebar width ramps linearly from 180px at a 640px viewport to 280px at
      770px, then holds (`--dz-sidebar-width` CSS variable). It is
      `position: fixed` from sm up — sticky produced a one-time upward nudge
      at the very bottom of the page (scroll-boundary clamp), fixed removes
      it by construction; the content column offsets by the same variable.
      36px inner rhythm (40px top inset), nav links with `usePathname`
      active highlighting (bold + surface). Content column always
      left-aligned with 40px margins (30px below 640px) and no max-width
      cap.
- [x] Mobile shell (below 640px): the sidebar becomes a sticky top bar —
      logo optically centred, Menu button on the right opening a full-screen
      menu that grows down from under the header (CSS height transition,
      scroll lock, links close it). Shared `nav-links.tsx` feeds both the
      sidebar nav and the mobile menu.
- [x] Album grid on the home page: all 17 albums, covers via `next/image`
      with per-breakpoint `sizes`, title + artist + explicit mark, 2→6
      columns stepping at owner-chosen breakpoints 720/890/1260/1600. The
      card text block is tight: 8px cover-to-title, no title-to-artist gap,
      both lines at 14px, and the explicit mark is 15px with its base on
      the title baseline. Static album pages at `/album/[id]`
      (generateStaticParams + generateMetadata with OG cover,
      Suspense-wrapped `params` per the Cache Components guide) with track
      lists — no playback yet.
- [x] Home page header: a 40px bold "Home" title whose cap height is
      optically level with the sidebar logo's top (-8.5px compensation for
      the 40/48 line box), followed by the first content section heading
      "Unreleased" (20px semibold); more sections to be defined by the
      owner.
- [x] Favicon: the owner's `public/favicon.png` (512px) wired through the
      root metadata `icons` field.
- [x] Cover corner radius stepped down one token everywhere: grid cards
      12→8px (`rounded-md`), album page header 16→12px (`rounded-lg`).

## Reverted, to rebuild in smaller steps

The player core, mini bar, durations (music-metadata), interactive track
lists, lyrics and full-screen player were built and verified as `5f9ccb3`,
then backed out by the owner (`4b4b1ee`) to be restarted in smaller,
reviewable steps. The code remains recoverable from `5f9ccb3`.

## Verified

| Check | Result |
| --- | --- |
| `pnpm lint` / `pnpm build` | clean; all 17 album pages prerendered |
| Grid | 2/3/4/5/6 columns stepping at 720/890/1260/1600px |
| Sidebar width | 180px at 640px, 280px from 770px up; content offset tracks it |
| Sidebar at page bottom | fixed positioning — logo stable at top:40 scrolled top and bottom |
| Home title | "H" cap top optically level with the logo top (both 40px) |
| Mobile menu | grows to full height under the header, links navigate + close |
| Explicit mark | owner's SVG via currentColor; 15px on cards, base on the title baseline |
| Favicon | `<link rel="icon">` emitted, file serves 200 |

## Not done yet

- Player, queue semantics, Media Session, mini bar, lyrics, full-screen
  player (rebuild in small steps from `5f9ccb3`).
- Track durations (music-metadata is still a devDependency, currently
  unused).
- Phase 8: PWA, sitemap, OG image generation, deploy.
- Mobile menu has only the two nav items — no theme toggle below 640px yet.
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

## Resolved decisions

Both blockers from the design foundation were decided by the owner on
2026-10-24:

1. **Functional colours** — approved values for `success`, `warning`, `danger`,
   `focus` and `selection` live in `core-template.md` §4.3. This closes OD-001;
   the core doc itself still says "Proposed" and should be updated by its owner.
2. **The "now playing" accent** — the DabMusic accent is the gray ramp ("ink"),
   per `core-template.md` OD-003. No hue is introduced.
