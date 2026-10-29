# Rebuild progress

Branch `rebuild`, started from `main` @ `ba35c61`. The shell, library, home
page, player (pill, full-screen and sub-1000 sheet) and the rebuilt album page
are in place; the PWA and deploy work remain.

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
- [x] Cover colour: `pnpm gen:colors` quantises each cover with sharp, scores
      buckets by `count × saturation` (skipping near-black/near-white), and
      writes **one** colour per album to `cover.color.json`, `{ color, mode }`.
      The colour's own lightness picks the mode — `L ≥ 0.5` is a light cover
      and gets the pale band (`0.90–0.94 L`, `C ≤ 0.04`), anything darker gets
      the deep band (`0.21–0.28 L`, `C ≤ 0.08`) — so the album page has one
      colour and the polarity it implies, not a pair. Today that is 4 light
      (AnotherB, DabRockstar, LOVE GOT ME NUMB, Skrt Freestyle) and 12 dark.
      Grey covers degrade gracefully to a neutral wash. Attached as
      `Album.tint`.

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
      below 1024px, then a fluid width of `(content − (N−1)·gap) / N`
      with 20px gaps — exactly 4 / 5 / 6 whole cards from 1024 / 1280 /
      1600px, so the last card ends 32px from the right edge just as the
      first starts 32px from the sidebar. Hidden scrollbar, scroll-snap.
      (The shelf uses flex longhands — the `flex` shorthand silently
      reset flex-basis and defeated the breakpoints.)
- [x] The shelves bleed to the **window**, not just to the gutter: a
      `dz-shelf-bleed` wrapper cancels `gutter + sidebar offset` on the
      left and `gutter` on the right, and `dz-shelf` restores them as
      asymmetric padding plus `scroll-padding-inline`. That is Apple's own
      geometry (`shelf-grid__list` sits at 0 with a sidebar-sized left
      padding) and it is what gives the translucent sidebar something to
      blur. The content column runs behind the sidebar for the same
      reason; `dz-container`'s left padding keeps the copy on the same x.
- [x] Shelf arrows centre on the **artwork** rather than the card and live
      inside their own gutters (2px to the card, 2px to the window edge).
- [x] Play/pause glyph: pause is dead-centre; play carries Apple's own
      proportional offset (7.55% of its ink width) so the two read as
      optically aligned without either moving on toggle.
- [x] Shelf arrows (`album-shelf.tsx`): Apple's 28×52 pills with their 9×31
      chevron, `blur(60px) saturate(1.8)` over `--dz-arrow-bg`; both ends are
      present at all times and go `disabled` at their end of the row. The right
      button is the same glyph mirrored with `scale: -1 1`, exactly as Apple
      does it. Two environment quirks are handled explicitly: `scroll-behavior:
      smooth` is **not** set in CSS (it routes programmatic scrolls through an
      animation loop that some webviews never run, so the row would not move at
      all), and the button falls back to a jump when a smooth `scrollBy` leaves
      the position unchanged; the at-end test is polled because `scroll` events
      are unreliable there.
- [x] `AlbumGrid` extracted so the home page and the artist page render the
      same card treatment from one place.
- [x] `/dabaz` is no longer a placeholder: it is the home layout filtered to
      `artist === "DabAZ"` (9 albums — 2 unreleased, 7 released), with each
      section conditionally rendered so an empty shelf never shows a heading.
- [x] Touch devices (`useTouchDevice`): Apple does no device detection at all —
      sideways dragging is plain `overflow-x` scrolling, which is why their
      shelves swipe on their own. We keep that, but reveal-on-hover controls
      would never appear without a pointer, so the shelf arrows and the cover
      play button are always visible when `(hover: none)`. The check also
      catches **iPadOS**, which reports a `Macintosh` user agent, via
      `maxTouchPoints >= 2` — the same trick Apple's own JS uses; a touchscreen
      laptop still counts as a pointer device.
- [x] New wordmark (966×224). The D mark fills 160 of the 224 units and the
      "i" dot sits at the very top, so the SVG is scaled to 25px overall to put
      the **mark** at 18px, and pulled up 7px so the mark's top edge stays on
      the 32px line the logo occupies.
- [x] Nav icons: lucide's paths fill their 24px canvas, where Apple's leave ~4
      units of padding and land at 14–16px of ink. A 2px inset brings ours into
      the same range without changing the 24px box, so row height and icon
      alignment are untouched.

- [x] Footer (`site-footer.tsx`), modelled on music.apple.com's: a band in
      its own shade — `rgb(50 50 50)` dark, `#f5f5f5` light (`--dz-footer-bg`)
      — with the copyright line at 64% and links at 92%, both 11px; 14px above
      the copyright, 5px between the lines and 81.4px below them, which is also
      the room the floating player needs (16px of air between the Feedback
      baseline and the pill's top edge), so the band reaches the page
      bottom.
      40px is the minimum gap above it, and `flex-1` on `<main>` keeps the
      footer at the bottom of the viewport when a page is short. Links
      underline on hover without changing colour, exactly like Apple's. The
      link row holds a single Feedback link to the repository's issue tracker;
      Apple's terms / privacy / cookie pages have no counterpart here.
- [x] **Album pages swap the band**: Apple's album footers are not the neutral
      shade — measured on four albums, the band is the page tint stepped down
      by **exactly 10 per channel** (`#2d1e11` over `#231407`, `#0e0e0e` over
      `#040404`, `#2e2e2e` over `#242222`), clamped at black. The page
      publishes that pair as data attributes on its wrapper, `AlbumFooterTint`
      moves the **visible** one onto `:root` after each navigation, and the
      footer paints it through the new `--dz-footer-surface` (neutral band
      everywhere else). The visible check is load-bearing: Next keeps the
      previous page mounted under `display: none` for instant back/forward, so
      a hidden album's attributes would otherwise win — and a page-level
      `<style>` on `:root` leaks for the same reason (it stayed applied on
      Home). The mutation observer exists because an album page streams in
      behind Suspense; it disconnects after two seconds.

### Player pill (measured against Apple's `chrome-player`)

- [x] Size: **54px tall, 668px at most**. Apple's floating bar is 54px and the
      pill inside it caps at 668px; ours spans the content column
      (`dz-player-inset`) and centres once the column is wider than 668.
- [x] Material: the glass shared with their sidebar — 55% `#f5f5f5` light,
      60% `gray-800` dark, `blur(16px) saturate(2.2)`, **no border**.
- [x] No waveform: progress is the pill's own outline, drawn clockwise from
      the point above the cover (a rounded rect's path starts at `x + rx`,
      which with `rx = 26` is exactly the cover's centre). A permanent 25%
      track sits under it; the track's left cap fades from the track colour to
      the progress colour so the wrap reads as a hand-over. Cover rotation and
      the ring share one rAF frame and one `currentTime`.
- [x] Volume popup: Apple's 120×40 horizontal pill, grown right-to-left out of
      the icon with `motion` and dismissed when the pointer leaves. The
      slider's hit area is the popup's full height across the bar's width. It
      is portalled to `<body>` because a `backdrop-filter` ancestor would
      otherwise swallow the blur.
- [x] **The popup's icon mutes rather than closes the popup**: one gesture was
      doing two different things in two places — the full-screen player's icon
      silences the track, the pill's icon dismissed the popup. It now calls the
      provider's `toggleMute`, so both restore the level they interrupted, and
      the popup stays where it is until the pointer leaves it.
- [x] Icons sized to Apple's ink: at ≥830px play/pause 20, shuffle/repeat
      11.5, volume 15, prev/next 11; below it play/pause 18 and next 14.4.
      The volume glyph is the speaker plus three arcs, one per third of
      the level, cross-fading as the level crosses.
- [x] Shuffle and repeat show a 2px dot under the glyph when active (Spotify's
      cue, the owner's ask) and drop to the artist line's grey when off.
- [x] Below **830px** the transport narrows to play/pause plus next, right
      aligned with the three gaps around them equal to the pill's own
      top gap.
- [x] **Idle state**: before anything is queued the pill still renders — flat
      25% ring, no gradient, no title/artist/times, and a disc carrying the
      DabAZ mark over Apple's missing-artwork colours (`#e9e9e9`/`#dcdcdc`
      light, `#323232`/`#434343` dark). Every button except volume drops to the
      artist colour.
- [x] The whole pill opens the full-screen player except the controls, with
      the default cursor everywhere but the buttons.

### Full-screen player, rebuilt to music.apple.com's measurements

The old full-screen view (artwork + transport on the left, lyrics on the right)
was taken apart: the lyrics column was removed from it — `LyricsView` is kept
and is wired back in behind a toggle later — and the view was rebuilt as a
single centred column, then measured against Apple's own player element by
element.

- [x] **Pinned dark**: the layer carries `dark`, so every semantic token inside
      resolves to the dark palette. Apple's full-screen view keeps its dark
      colours in light mode too; before this it followed the site theme.
- [x] **Close button**: Apple's measured geometry is an 18×18 glyph at (20, 16)
      with no padding. Lucide's `X` leaves four units of canvas on every side,
      which at 18px reads visibly smaller, so their own full-bleed
      `viewBox="0 0 18 18"` path is inlined.
- [x] **Column sizing**: `--dz-fs-col: min(600px, max(430px, calc(66vh - 72px)))`
      — Apple scales its artwork with the viewport (min(36vw, 62.5vh, 600px):
      450px at 720p, 600px from 1080p) while the type stays fixed, so a large
      window gets a bigger card instead of the same small one. Ours is driven
      from the height and calibrated so the approved 1377×760 window keeps
      exactly 430px.
- [x] **Vertical geometry (≥1000px)**: the whole column is centred in the
      viewport, so the air above the artwork equals the air below the volume
      track. The track is what it ends on, not the 12px input box: the volume
      row carries `-mb-[5px]` (4px of dead space under the 4px track plus 1px
      of row) so the block is symmetric to the pixel.
- [x] **`--breakpoint-full: 1000px`** is a named breakpoint beside `shell` and
      `pill`. Custom variants sort *before* `sm:` in the cascade, so
      `full:px-5` cannot override `sm:px-8`; the few places that need to fight
      a `sm:` utility use a negative margin instead.
- [x] Type from their player: title and artist line both **17px/700 with a
      22px line box** (the artist line at 64% white, no smaller), time row
      **11px/500** at 55%.
- [x] Explicit mark: measured 17×17 with its ink filling the box, so the badge
      is drawn at 17px and nudged 1px up — the flex box centres on the 22px
      line box, while the perceived centre is the cap height. 3px gap, which is
      Apple's own.
- [x] Colours, all measured from their player: title 92% white, artist 64%,
      times 55%, shuffle/repeat 64% at rest, prev/next 80%, play/pause and the
      played waveform solid white, unplayed waveform 64%, volume icon 92%.
- [x] Transport spacing is optical: the play glyph sits the same distance from
      the waveform's bottom edge as from the volume track (32.5px each,
      `mt-1` above and `mt-[19.5px]` below).
- [x] Album name links back to its album page and closes the overlay first.
      Hover underlines it (Apple's own cue); every control takes
      `cursor-pointer`, and hover brightening is limited to prev/next, shuffle,
      repeat, the volume icon and the lyrics button — the owner asked for the
      close button, waveform and play/pause to keep their colour on hover.
- [x] The backdrop's `scale-125` blurred cover is clipped
      (`overflow-hidden`): it otherwise registers as *scrollable overflow* on
      the dialog, and focusing the bottom-right control made Chrome scroll that
      hidden overflow by 172/95px, shifting the whole layer.
- [x] **Scrubbing silences playback**: dragging the waveform pauses on the
      first real movement and resumes when the pointer is released, landing on
      the release position. A plain click only seeks — `WaveformSeek` reports a
      scrub only once the pointer has actually moved, and applies one last seek
      on release so the position is exact. The pause is `setPlaying(false)` on
      the provider rather than `togglePlay`, so nothing can flip mid-drag.
- [x] **The volume icon is a mute toggle**: pressing it silences the player and
      a second press returns to the exact level it interrupted; a level that
      was dragged to zero returns to the last audible one.

### Lyrics column (behind a toggle, measured against Apple's player)

`LyricsView` came back into the full-screen view behind the corner button
rather than as a permanent column.

- [x] **Toggle position**: a 28px box 20px from the right and 23px from the
      bottom — Apple's own measurements — 64% white until switched on, then
      solid white with the filled glyph. It carries `z-10`: the content row
      spans the full width and would otherwise swallow the click.
- [x] **Two columns from 1000px**: the song column stays centred inside the
      left half at 62% of that half (capped 600px), and the lyrics take the
      right half from the viewport's mid-line — Apple's lyric text starts
      exactly there — capped at 38vw, which is the width their longest line
      wraps to. Both sides are proportional, so a narrower window narrows both.
      Below 1000px the lyrics get the whole page.
- [x] The lyric band is bookended to the content row (`inset-y-0`), so its top
      and bottom line up with the artwork's top and the volume track's bottom.
- [x] **Type**: the sung line and the rest share 32px/600 at 1.25; the current
      line is full white, the others 30% with a 2px blur (measured — Apple's
      edge gradients drop from ~75 to ~15 against the active line).
- [x] **Reading is not selecting**: the column is `select-none`; every line is a
      button that seeks to its own timestamp, with `cursor-pointer`.
- [x] **Per-line fade**, not a mask: a CSS mask ramps *through* a two-row line
      and splits its brightness (measured 200 vs 180), so each line's opacity
      is computed from its own top and bottom edges — a short fade over the
      first 80px, solid to the mid-point, then out to the bottom.
- [x] **Hand-over**: a sung line fades all the way out over 1.5s off its own
      clock, so a burst of short lines leaves two or three of them mid-fade
      above the highlight; the incoming line snaps on (`duration-0`).
- [x] **Scrolling belongs to the reader for four seconds**: the wheel reveals
      every line at once (no slow fade-in — that read as "nothing happened"),
      then after the grace the sung lines fade out again **and the list glides
      back to the anchored line**, which matters when playback is paused and
      nothing else would ever move it.
- [x] **Own scroll tween**, 900ms ease-out: the browser's `behavior: "smooth"`
      duration cannot be tuned, and a glide is cancelled the moment the reader
      scrolls. `prefers-reduced-motion` jumps instead.
- [x] **Anchor**: the sung line's centre sits on the artwork's centre line
      (`centerOffset`, half the artwork's height, measured through a
      `ResizeObserver` — `next/image` does not forward a ref). Before the first
      line the count-in row is the anchor instead; with the artwork column
      hidden the offset is 0 and the view centres in its own box.
- [x] **Count-in**: three 16px dots in one lyric line's slot. They light at
      4s, 3s and 2s before the first line (one at a time, 25% white → white),
      fade in over 0.8s, and fade out over 0.4s when it starts. The row keeps
      its slot for the whole track: unmounting it removed 68px of layout and
      snapped the list in the middle of the hand-over glide.
- [x] **Fetch retries**: a failed request clears the cache entry and retries
      twice (600/1200ms), so a dev-server restart no longer leaves the panel
      blank for the rest of the session.

### Album page, rebuilt to music.apple.com's album page

Measured from their `container-detail-header` and `songs-list` markup on a
15-track album at 1377×900, then rebuilt; the tint underneath is theirs too.

- [x] **Page tint**: Apple paints the whole scrolling page in the artwork's own
      colour — their measured background for a brown cover is `#2d1e11`
      (OKLCH L 0.25) — flat, with no gradient, and it runs behind the
      translucent sidebar. One colour per album, and **the colour decides the
      page's polarity**: a pale tint gets a light page and a deep one a dark
      page, in both site themes, exactly as Apple's `--dark-layout` header and
      `-onDark` tokens do it. The site's `.light` token scope exists for this —
      a light album inside a dark site still renders a light page. Contrast is
      by construction: the 92% label keeps ≥12.5:1 and the 64% muted line
      ≥6.7:1 on the deep band, ≥12.7:1 / ≥5.2:1 on the pale one.
- [x] **The mode reaches the chrome**: sidebar, top bar, footer and the player
      pill all sit in the album's mode rather than the site's. The footer is
      the one part the page cannot paint itself (it belongs to the site
      layout), so `AlbumFooterTint` copies the page's `data-mode` onto `<body>`
      and its `data-footer` onto `:root` after each navigation — reading only
      the *visible* page, because Next keeps the previous page mounted under
      `display: none`.
- [x] **Header**: a 270×270 artwork at the content's top line (their hero art
      drops both radius and shadow; ours keeps the home page's **7px** corner
      so the two surfaces match, plus a `--dz-hairline` rim), headings centred
      against it and the transport on the artwork's bottom line. That is their
      own grid: 36 / 234 / 36 rows with the 270px cover spanning the last 270,
      so the title sits 77.3px below the cover's top — ours lands at 77.5 —
      and the actions' bottom edge is the cover's.
- [x] **Type**: title 26/30 bold, artist line 26/30 regular in the same 92%
      label colour, meta 12/15 semibold at 64% with a 4px gap, explicit mark
      19px sitting 6.5px after the title and centred on the line box. Below
      **1024px** — Apple's own breakpoint — the block stacks and centres:
      270px cover, 22/26 title, 20/24 artist line, 12/15 meta, transport 14px
      under the meta.
- [x] **Transport**: their 36px shuffle circle (4% wash, no border) 12px from
      the 36×130 pill; the pill is 15px semibold with a 15px glyph and a 24px
      radius. Shuffle does what theirs does — turns the mode on *and* starts
      the album from a random track — rather than only flipping the pill's
      dot.
- [x] **Track list**: 46px rows with **no separators** (their web album pages
      draw none; the rules we used to draw came from the native app), 13px/16
      titles at 92%, durations 13px at 64% flush right, and a **6% wash with
      the play glyph taking the number's place on hover**. The current row
      keeps the semibold title and the pause glyph — Apple marks it with a hue
      we do not have.
- [x] **Number column**: from 1024px it is Apple's — 40px wide with the number
      centred in it. Below that it narrows to 28px and **left-aligns the
      digit on the page gutter**, which is the player pill's own left edge, so
      a phone row starts flush with the player; the title follows at the
      column's 28px. (Left-aligning costs the single-digit rows almost 9px of
      extra gap; a shared left edge and a shared gap cannot both hold.)
- [x] **Meta line**: `year · N tracks · runtime`, built from what the library
      actually holds; an unreleased album simply drops the year.
- [x] **Artist line**: links to `/dabaz` for the catalogue's own artist, the
      only artist page that exists; every other name stays plain text.
- [x] **Deliberate deviations**: durations stay visible on phones (Apple hides
      them behind a `…` menu we do not have), and row text uses the standard
      muted token rather than a colour mixed out of the artwork tint.

### Sub-1000 player, rebuilt on Apple's mobile sheet

Apple's phone-sized player is not the desktop one shrunk. The close
affordance is a full-width band you pull down rather than a corner glyph, the
stack is bottom-anchored with the artwork taking whatever height is left, and
the lyrics live *inside* that stack rather than beside it. Rebuilt to those
measurements, with every element on the site's own gutter.

- [x] **Collapse bar, no X**: below 1000px the whole 51px top band is the
      target, carrying Apple's own 24×8 chevron centred 23px down; the 18×18
      corner glyph stays for ≥1000px. The band needs `z-10` — the content row
      starts 20px down and otherwise paints over it and swallows the click.
- [x] **The sheet slides down**: collapsing below 1000px animates `y: 100%`
      for 320ms on Apple's own `[0.32, 0.72, 0, 1]` curve, in place of the fade
      and spring the wide layout keeps.
- [x] **One gutter, not a player inset**: every element sits on
      `--dz-gutter`, the distance the home page keeps from the sidebar, so the
      stack lines up with the page it opened from. The wrapper stopped padding
      the whole column and each layout owns its own spacing.
- [x] **Artwork as large as it can be**: the cover region is a CSS size
      container, and the square takes `min(100cqw, 100cqh − 78px)` — 78 being
      two 39px gaps — so it fills the height that is left and keeps exactly
      39px above and below at every size. `w-auto` before this held the artwork
      at the asset's own pixel width however much room there was.
- [x] **Bottom block**: full-width waveform with elapsed/remaining beneath it,
      the transport spread `justify-between` so shuffle and repeat sit flush
      with the waveform's own edges, a full-width volume bar, and the lyrics
      button centred 20px off the bottom. The whole transport is white —
      Apple's mobile transport does not dim prev/next the way the wide one
      does — so shuffle and repeat keep the 2px dot as their only "on" cue.
- [x] **The measured ladders**: song info → waveform 39, play glyph ↔ waveform
      39, play glyph ↔ volume track 39, volume track → lyrics icon 23, lyrics
      icon → bottom edge 23 (the collapse chevron's own distance). Times are
      11px/500 at 55%, as in the wide layout.
- [x] **Lyrics inside the stack**: opening them leaves the waveform, transport
      and volume bar exactly where they were, and the artwork collapses into a
      56px thumbnail with the track's identity beside it at the stack's own
      17px type. That row caps the lyrics from above and the waveform caps them
      from below. Only one `LyricsView` is ever mounted: `useMediaQuery` picks
      the stack below 1000px and the absolute right column above it.
- [x] **The sung line hangs 56px under the header** — twice the 28px the list
      keeps between lines — through a new `anchorTop`, which pins the line's
      *top* rather than its centre and ramps the top edge fade over the same
      56px, so the pinned line still reads at full strength instead of being
      halved by the old 80px ramp.
- [x] **Two layout faults measured away**: `py-[45vh]` sat on the scroller
      itself, and under border-box that floors its height at 90vh (720px here)
      — 43px more than the band the header leaves, which pushed the whole panel
      up and clipped the header. It now lives inside the scroller. The
      scroller's `px-1` had also put the lyrics 4px right of the artwork;
      removing it aligns text, cover and waveform on the same 30px edge.

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
| Shelves | horizontal rows: exactly 4 / 5 / 6 whole cards at 1024 / 1280 / 1600px; last card 32px from the right edge, first 32px from the sidebar |
| Shelf arrows | both ends always present, mirrored glyph, disabled at their end; paging 0 → 891 → 1042 → back |
| Artist page | `/dabaz` shows the 9 DabAZ albums, home still shows all 17 |
| Touch detection | iPad (Mac UA + 5 touch points), iPhone and iPadOS true; desktop, Mac and touchscreen laptops false |
| Logo | D mark 18px tall, overall 25px, mark top on the 32px line |
| Nav icons | ink 16.7px / 13.3px inside a 24px box (Apple: 14–16px) |
| Shell | top bar ≤483px, sidebar from 484px; width ramps 180 → 260px (capped); logo stable at the page bottom |
| Home title | 34/40 bold, "H" cap top optically level with the logo top |
| Mobile menu | grows to full height, blurs the page behind (portal), links navigate and close it |
| Materials | bars and menu at `surface-secondary/60` + `blur(16px) saturate(2.2)`; edges 0.75px hairline |
| Explicit mark | owner's SVG via `currentColor`; 10px on cards, 9px in track rows, 16px beside the album title |
| Playback | audio plays, survives navigation, queue/next/previous behave; shuffle and all three repeat modes cycle correctly |
| Waveform | clicks seek to the exact position; drag and keyboard both work |
| Vinyl | angle tracks `currentTime × 12°`; seeking back spins it counter-clockwise |
| Volume | popup 120×40 inside the pill, slider hit area the popup's full height; pointer drag sets `audio.volume`, leaving the popup closes it |
| Space | toggles play/pause, skipped on focused buttons and in text fields |
| Cover tint | dark red on Deep Voice, olive on Come Again, neutral on grey covers; light theme gets the pale tint |
| Footer | band 140px tall, 40px minimum gap above, anchored to the bottom of the viewport on short pages |
| Media Session | metadata + artwork set, `playbackState` follows both directions |
| Player pill | 54px tall, 668px cap, glass with no border; ring and cover spin off one frame; icons at Apple's ink sizes |
| Player breakpoint | 830px: six controls above, play/pause + next below, three equal 19.8px gaps |
| Idle pill | renders with no queue: flat ring, DabAZ disc, artist-grey buttons, volume the only full-strength one |
| Full-screen column | 430px at 1377×760, 522px at 900 tall, 600px from 1050 tall; centred at every size |
| Full-screen centring | artwork top to viewport top == volume track bottom to viewport bottom: 54.3/54.3 at 1377×760, 87.5/87.5 at 1000×700, 134.9/134.9 at 1920×1080 |
| Close glyph | 18×18 at (20, 16), matching Apple's measured button box |
| Explicit mark (full-screen) | 17×17, ink centred on the cap height (badge centre 513.5 vs text 514) |
| Full-screen colours | title 92% / artist 64% / times 55% (11px/500) / shuffle+repeat 64% / prev+next 80% / play-pause and played waveform white, unplayed 64% |
| Backdrop clip | dialog `scrollWidth === clientWidth`, `scrollTop` stays 0 when the corner control is focused |
| Scrub | dragging pauses (`pause@71.3` in the element's own events) and resumes at the release position (`play@175.2` for a 175.1s seek); a plain click seeks with no play/pause events at all |
| Mute | icon click takes the volume 0.35 → 0 → 0.35; `aria-label` flips Mute/Unmute |
| Pill mute | the popup's icon silences and restores the track: `audio.volume` 1 → 0 → 1 |
| Lyrics toggle | 28×28 at Apple's spot (right 20 / bottom 23), reachable at both ends of the split |
| Lyrics split | left column centred in its half (427px at 1377, 310px at 1000); lyrics start on the mid-line (689 ± 1) and stop at 38vw |
| Lyric seeking | clicking line 21 took the audio from 12.7s to 76.1s; the column is `user-select: none` |
| Lyric hand-over | the sung line runs 1 → 0.69 → 0.37 → 0.12 → 0 over ~1.4s; two or three can be mid-fade at once (0.77 and 0.48 measured together) |
| Lyric scrolling | wheel makes every line visible within 150ms (1/1/1) and the blur drops; after the 4s grace the sung lines fade and the list returns to the anchor |
| Scrolled while paused | scrollTop 1248 → 534 and the sung line back to +0.1px of the artwork's centre after 5.2s |
| Lyric glide | 900ms tween, measured 750–800ms of motion for a 141px move (ease-out) |
| Count-in dots | 16×16, row centre on the artwork's centre (272.3 vs 272.5); light at 4s/3s/2s before the first line; 0.8s in, 0.4s out |
| Count-in hand-over | no snap: the row keeps its slot, so the line moves ≤11px per frame along the glide |
| Sub-1000 artwork | 364×364 at 574×800, exactly 39px of air above and below; square at every size, edges on the 30px gutter |
| Sub-1000 ladders | info → waveform 39, play glyph ↔ waveform 39, play glyph ↔ volume track 39, volume track → lyrics icon 23, lyrics icon → bottom 23 |
| Sub-1000 lyrics | waveform/transport/volume stay at 578/650/714 with lyrics open; the lyrics band is 107→578, exactly between the header and the waveform |
| Lyric anchor (sub-1000) | sung line's top at 163 against the header's cover bottom at 107 — 56px, twice the line gap; the pinned line's content opacity stays 1 |
| Lyric left edge | text ink 30.00, cover 30, waveform 30 |
| Lyrics scroller | 471px inside its slot with the dialog's `scrollTop` at 0; a 45vh padding on the scroller floored it at 720 and shifted the panel 43px |
| Album header | 270×270 cover at 7px radius (the home cards' corner, not Apple's square) on the content line; title 77.5px below the cover's top (Apple 77.3); transport bottom-aligned with the cover; 34px cover→headings gap |
| Album rows | 46px, no separators, title 13/16 at 92%, duration 13 at 64%; hover = 6% wash + 16px play glyph in the number's slot |
| Album number column | ≥1024px Apple's 40px centred column; below it 28px with the digit's ink at 30.00 = the pill's left edge (375/390), title ink 58; hover glyph at 31.1 |
| Album tint | one colour + mode per album; 4 light (`#cae1f8`, `#eedbc1`, `#dedede`, `#f8d5cf`) and 12 dark; 92% label ≥12.5:1 and 64% muted ≥6.7:1 on the deep band, ≥12.7:1 / ≥5.2:1 on the pale one |
| Album mode | dark album on a light site renders dark (white 92% title, `#3f0b06` band) and a light album on a dark site renders light (black 88% title, `#c0d7ee` band) — chrome included; Home and /dabaz keep the site theme, including after album→Home→album |
| Album responsive | centred stack at 1023px (270 cover, 22/26 title, centred transport), two-column at 1024px; 375px keeps the 270px cover with ±30px gutters |
| Album shuffle | three presses gave three different tracks on the same album (`out-the-box`, `who-i-am`, …) and left `aria-pressed` true |
| Album footer band | tint −10 per channel on every album (`#491510 → #3f0b06` dark, `#f8d5cf → #eecbc5` light, `#022a4b → #002041`); Home, artist and the album→Home→album round trip all return to the neutral `rgb(50 50 50)` band |

## Remaining

Phase ordering follows `docs/development-plan.md`; the phases that shipped are
recorded under **Done** above.

### Mobile polish

- Mini bar below `md` (768px): the waveform and transport are hidden today —
  decide what a compact bar shows (cover + title + play/pause is the minimum).
- Mobile menu (below 484px): add the theme toggle — there is no way to switch
  theme at that size right now — and decide whether it lists anything else.

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
