# DMLL — DabMusic Lyric Language

**Status:** v1 · **Extension:** `.dmll` · **Encoding:** UTF-8

DMLL is DabMusic's own lyric format. It is a line-oriented, plain-text superset
of LRC: a `.dmll` file can carry the same line-level lyrics as `.lrc`, plus
optional word-level timing for the Apple-Music-style sweep.

It is deliberately smaller than TTML/AMLL. The site does not render
translations, romanisation, Japanese ruby/furigana, song sections, platform
metadata, or named singers, so none of those exist in DMLL.

## 1. Quick reference

```dmll
[dmll:1]

// Whole-line comment.
[v:left]
[00:00.80] {00:00.80~00:01.07}Drugs {00:01.07~00:01.31}got {00:01.31~00:01.54}me {00:01.54~00:01.80}numb
[ad:00:03.21] {00:03.21~00:03.44}Drugs {00:03.44~00:03.65}got {00:03.65~00:03.85}me {00:03.85~00:04.07}numb

[00:04.09] Drugs got me numb

[v:right]
[00:34.62] {00:34.62~00:34.88}What {00:34.88~00:35.12}you {00:35.12~00:35.36}are {00:35.36~00:35.69}listening {00:35.69~00:35.91}to {00:35.91~00:36.14}is {00:36.14~00:36.36}a {00:36.36~00:36.63}world {00:36.63~00:36.94}premiere
[ad:00:40.75] {00:40.75~00:40.98}Hahahahahaha
```

## 2. Line types

| Line | Meaning |
| --- | --- |
| `[dmll:1]` | Optional version header. Must be the first non-blank line when present. |
| `// ...` | Whole-line comment. Only recognized when `//` starts the trimmed line. |
| `[v:left]` / `[v:right]` | Standalone voice directive. Applies to every following line until the next directive. Default is `left`. |
| `[mm:ss.xx] body` | A normal timed line. |
| `[mm:ss.xx] {start~end}word ...` | A word-timed line. |
| `[ad:mm:ss.xx] body` | An ad-lib attached to the previous timed lyric line. |
| `[ad:mm:ss.xx] {start~end}word ...` | An ad-lib with its own word timing. |
| blank | Ignored. Use freely between sections. |

A line with no timestamp is kept as untimed text for the static read-through
fallback. A line with a timestamp but no body is ignored.

## 3. Timestamps

Times are absolute, in seconds from the start of the track. The accepted
shapes are the same as LRC:

```text
[mm:ss]
[mm:ss.x]
[mm:ss.xx]
[mm:ss.xxx]
[m:ss.xx]
```

The fraction separator may be `.` or `:` (so `[01:23:45]` means 1 min 23.45 s).
Milliseconds shorter than three digits are padded on the right: `.4` is 400 ms.

Word tokens use the same timestamp syntax inside braces:

```dmll
{00:12.34~00:13.10}
```

## 4. Word tokens

A `{start~end}` token applies to the text that follows it, up to the next token
or the end of the line.

```dmll
[00:00.80] {00:00.80~00:01.20}Drugs {00:01.20~00:01.60}got
```

- `end` must be at or after `start`; equal times are allowed (the word is
  instantly complete).
- One token is one word for Latin text, or one character for CJK text.
  Punctuation belongs to the preceding word.
- The text between tokens is preserved verbatim, including spaces. For Latin
  text, put the separating space at the **end** of the preceding token's text.
  For CJK text, no spaces are needed.
- A line without any token keeps the ordinary line-level highlight. Word
  timing is optional per line and per ad-lib.
- A word's end is explicit. If a word is followed by a pause, end it before the
  next token starts; the sweep holds at the end of the word.

### Text before the first token

Text before the first token is treated as the first word: it runs from the
line's timestamp to the first token's start.

```dmll
[00:00.80] Drugs {00:01.00~00:01.40}got
```

Here `Drugs ` is timed `00:00.80–00:01.00`, and `got` is `00:01.00–00:01.40`.

### CJK

```dmll
[00:00.80] {00:00.80~00:00.95}药 {00:00.95~00:01.10}物
```

No spaces between tokens. Each character sweeps independently.

### Multi-timestamp lines

A line may carry several timestamps, as in LRC:

```dmll
[00:12.34][00:20.00] {00:12.34~00:12.80}one {00:12.80~00:13.10}two
```

The word tokens are written against the first timestamp. For each repeat, the
parser shifts every word by the difference between that line timestamp and the
first one. In the example, the second occurrence's words are
`00:20.00–00:20.46` and `00:20.46–00:20.76`.

## 5. Voices

`[v:left]` and `[v:right]` are **block directives**, not per-line tags:

```dmll
[v:left]
[00:00.80] ...
[00:03.21] ...

[v:right]
[00:34.62] ...
[00:40.75] ...
```

- The default before any directive is `left`.
- A directive persists through blank lines and comments until the next
  directive.
- There is no `[v:left]` requirement on every line.
- Word tokens and ad-libs inherit the voice of their block.

## 6. Ad-libs

`[ad:mm:ss.xx]` starts an ad-lib line. It attaches to the **most recent timed
lyric line** above it.

```dmll
[00:41.00] Yeah, uh, yeah, on top of the building, yeah
[ad:00:41.80] (yeah)
[ad:00:42.30] (what?)
```

- Several ad-libs may follow one lyric line.
- An ad-lib can have word tokens, and its words sweep on their own timeline.
- Ad-libs inherit the parent line's left/right alignment.
- An ad-lib is only lit while its parent line is the current line. Once the
  next lyric takes over, the ad-lib drops back to the dim state.
- A voice directive ends the attachment, so place ad-libs before the next
  `[v:...]` line.
- Ad-lib times should normally be before the next lyric line, otherwise the
  parent may already be fading when the ad-lib fires.

## 7. What is intentionally missing

Compared with TTML/AMLL, DMLL v1 has no:

- translations (`x-translation`)
- romanisation / romanization (`x-roman`)
- Japanese ruby / furigana (`tts:ruby`)
- song sections (`itunes:song-part`)
- named singers / agents (`ttm:agent`)
- line IDs (`itunes:key`) and sidecar translation files
- platform IDs, `amll:meta`, `amll:obscene`, `amll:empty-beat`
- XML, namespaces, `<iTunesMetadata>`

Song title, artist, album and explicit flags already live in `album.json`.

## 8. Rendering semantics

The format describes data; the current renderer applies it like this:

- Only the **current** line is swept.
- Each word is an inline span. A bright copy is masked up to the word's
  progress:

  ```text
  progress = clamp((currentTime - start) / (end - start), 0, 1)
  ```

- The soft edge of the mask trails the progress, so the already-sung part is
  bright and the unsung part stays dim.
- The sweep is driven at animation-frame rate from the audio element, not from
  the player's `timeupdate` (roughly 4 Hz).
- The line-level treatment is unchanged: the current line is crisp, other lines
  are dimmed and softly blurred, and a sung line fades out after the next line
  takes over.
- Under `prefers-reduced-motion`, word timing is ignored and the line falls back
  to the ordinary line-level highlight.

## 9. Parser and loader integration

- The parser accepts DMLL and plain LRC through the same entry point.
- A line is word-timed only if it contains at least one valid
  `{mm:ss.xx~mm:ss.xx}` token. Other braces are literal text.
- `album.json` picks one lyric file per track:

  ```json
  {
    "file": "love-got-me-numb.mp3",
    "title": "LOVE GOT ME NUMB",
    "dmll": "love-got-me-numb.dmll"
  }
  ```

  `lrc` and `dmll` are mutually exclusive. A track listing both fails the
  library scan.
- `public/sw.js` caches both `.lrc` and `.dmll` runtime assets.

## 10. Relationship to LRC

- Existing `.lrc` files remain readable: plain lines, multiple timestamps,
  `[v:]`, `[ad:]` and the legacy `>> a | b` form all still parse.
- New files should use `.dmll`; the legacy `>>` form is kept only for old
  files.
- A `.dmll` file can be a pure line-level file with no `{...}` tokens at all.

## 11. Conversion note

When a track only has line-level LRC timestamps, DMLL word tokens can be
estimated by distributing each line's duration across its words. The generated
file in this repository marks that explicitly:

```text
// word timings estimated from the line-level LRC; tweak by ear
```

Estimated timings look convincing for a first pass but are not a substitute for
real word-level timing data.
