# DabMusic lyric extensions

> For word-level sweep timing, see [DMLL](./dmll-format.md). The syntax below
> remains the line-level subset that old `.lrc` files use.

DabMusic reads standard `.lrc` files unchanged. On top of that, a file may use
two optional in-band extensions. Both are plain lines, so a file that uses
neither behaves exactly like ordinary LRC.

## Voices

`[v:left]` or `[v:right]` on a line of its own sets the side for every following
lyric line, until the next directive. The file starts on the left, so
`[v:left]` is only needed to switch back from a right-voice block.

```lrc
[00:00.80] Drugs got me numb

[v:right]
[00:34.62] What you are listening to is a world premiere
[00:40.75] Hahahahahaha

[v:left]
[00:41.00] Yeah, uh, yeah, on top of the building, yeah
```

The first line above is left-aligned (the default); the two lines after
`[v:right]` sit flush right; `[v:left]` brings the next line back.

The directive has no timestamp and is never rendered. It must be alone on its
line; a line that carries a timestamp is an ordinary lyric line.

## Ad-libs

An ad-lib is a line of its own, starting with `[ad:mm:ss.xx]`, written directly
under the lyric line it belongs to:

```lrc
[00:41.00] Yeah, uh, yeah, on top of the building, yeah
[ad:00:41.80] (yeah)
[ad:00:42.30] (what?)
```

- The ad-lib is rendered underneath its parent, smaller and dimmed.
- Each ad-lib has its own timestamp and brightens independently; several may
  follow one line.
- It inherits the parent's side (`left` or `right`).
- It attaches to the most recent timed lyric line, so write it directly under
  that line. A voice directive clears the attachment, which means an ad-lib
  placed before the first line of a block is ignored.

## Standard LRC

Everything else is untouched:

```lrc
[ti:Love Got Me Numb]
[00:00.80] Drugs got me numb
[01:23.45][01:27.10] one line reused at two timestamps
```

Untimed lines still become the static read-through fallback.

## Legacy duet form

The old `>> a | b` form still parses:

```lrc
>> [00:00.80] Drugs got me numb | [00:03.21] Drugs got me numb
```

`b` is rendered as an ad-lib under `a`, as before. New files should use
`[v:right]` for a separate voice and `[ad:]` for an ad-lib.
