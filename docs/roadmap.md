# Roadmap

What is left after `fae071b`, in the order it should be built. Phases 1–5 of
`docs/development-plan.md` are done (design foundation, library, shell, album
pages, player cuts 1–2); this file covers the remainder plus the loose ends the
rebuild left behind.

Each phase ends the way the earlier ones did: `pnpm lint`, `pnpm build`, a real
browser check, and one commit (push once the phase is finished).

---

## 1. Track durations

Smallest piece, unblocks the album header and the queue's "time remaining".

- Re-wire `music-metadata` (already a devDependency, unused since the revert)
  into the scanner: parse each file once, cache per absolute path, expose
  `Song.duration` in seconds.
- Show it in the album track list (right-aligned, tabular) and the album header
  total (`3 tracks · 6:59`).
- Keep the existing build-failing validation behaviour: an unreadable file
  should warn, not fail, so a bad rip cannot block a deploy.

**Done when:** every track row shows a real duration and the header total
matches the sum.

## 2. Lyrics

- Port `src/lib/lrc.ts` from `5f9ccb3`: plain `[mm:ss.xx]` lines,
  multi-timestamp lines, and the `>> lead | echo` duet format.
- `LyricsView` fetching per URL with a module-level cache, active-line
  highlighting with a ~0.35s lead, duet echo revealed at its own timestamp.
- Auto-follow that yields to manual scrolling for a few seconds and collapses to
  instant jumps under `prefers-reduced-motion`.
- Only one track file in the catalogue uses the duet format
  (`love-got-me-numb`) — that is the acceptance case.

**Done when:** the lyrics list follows a playing track smoothly and the duet
lines render both parts.

## 3. Full-screen player

- Open from the mini bar (the cover or a chevron), close with Escape/back.
- Large artwork and lyrics side by side on desktop, stacked on small screens.
- Same transport as the mini bar, plus the waveform at a larger height
  (`WaveformSeek` already takes a `height` prop).
- Use the album tint as the backdrop so the page and the player agree.

**Done when:** opening and closing is fluid, the lyrics scroll in the expanded
view, and playback state is shared with the mini bar (single audio element).

## 4. Media Session

- Port `use-media-session.ts` from `5f9ccb3`: metadata (title, artist, artwork
  as an absolute URL), `playbackState`, position state, and action handlers for
  play / pause / next / previous / seek.
- Verify on a real lock screen or headset if possible; otherwise assert the
  handlers are registered and `navigator.mediaSession.metadata` is populated.

**Done when:** OS controls drive the same audio element.

## 5. Mobile polish

- Mini bar below `md`: the waveform and transport are currently hidden — decide
  what a compact bar shows (cover + title + play/pause is the minimum).
- Mobile menu: add the theme toggle (there is no way to switch theme below
  640px right now), and decide whether it should list anything else.
- Check the album header at 375px: the 232px cover dominates the viewport.

## 6. PWA and metadata

- `manifest.ts` with the owner's icons (`public/favicon.png` is 512px;
  `public/apple-icon.png` is in the tree but **not yet wired** — move it to
  `src/app/apple-icon.png` or declare it in metadata).
- Service worker: cache the app shell and the artwork, **never the audio**
  (223 MB, and range requests break with naive caching).
- `sitemap.ts` and `robots.txt`.
- Generated per-album OG images (`opengraph-image`) using the cover and the
  cover-derived tint.

## 7. Deploy and merge

- Vercel preview, verify audio streaming and `next/image` optimisation on the
  real domain.
- Merge `rebuild` into `main` (squash or a clean merge commit — the branch
  carries one commit per section), then delete the branch and
  `backup-pre-squash`.

---

## Loose ends worth scheduling

- **History/runtime**: on another machine there may be unpushed commits based on
  `8fcb2ce`; pull with `--rebase` before pushing there.
- **Queue view**: `IconQueue` is in the icon set but unused — a "Play next / add
  to queue" affordance and a queue panel would complete cut 2.
- **Volume persistence**: the level resets on reload; persisting it (and shuffle
  / repeat) is a few lines in `localStorage`.
- **Search**: 17 albums fit on one page, so this is not urgent, but it is the
  obvious next feature once the catalogue grows.
- **Mini bar on album pages**: verify that the bar's `max-w-4xl` still looks
  right against the tinted background.
- **`docs/development-plan.md`** still describes the original 8 phases; fold
  this roadmap into it once the remaining phases land.
