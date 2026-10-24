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
      wired through `next/font/local`, with the CJK system fallback stack declared
      in `globals.css`.
- [x] App metadata: `DabMusic`, `%s | DabMusic` title template, `metadataBase`,
      description `I AM MUSIC.`

## Verified

| Check | Result |
| --- | --- |
| `pnpm lint` | clean |
| `pnpm build` | clean; `/` and `/_not-found` prerendered |
| `pnpm dev` | serves 200 |
| Inter actually loaded | `document.fonts.check("16px inter")` → `true` |
| Music assets | `/music/all-that-remains/cover.jpg` and the mp3 both return 200 |

## Not done yet

- No design tokens and no theme switching. `globals.css` currently carries only
  the font stack.
- No library data layer, and no route beyond the placeholder page.
- No player and no lyrics.

## Open decisions, blocking the design foundation

Both are explicitly marked open in the design spec, so they should be decided
rather than guessed:

1. **Functional colours** — `success`, `warning`, `danger`, `focus`, `selection`
   have no approved values yet.
2. **The "now playing" accent** — the previous build used `red-500`, which the
   spec does not sanction. The spec defines no brand accent colour, so this needs
   a decision before the album and track lists are built.
