/**
 * LRC parsing.
 *
 * Supported shapes, all in one pass:
 *   `[01:23.45] text`            — the common case
 *   `[01:23.45][01:27.10] text`  — one line reused at several timestamps
 *   `>> [00:01.00] a | [00:03.00] b` — two vocal lines sung back to back; `b`
 *                                      is revealed once its own timestamp hits
 */

export interface LyricSpan {
  /** Seconds from the start of the track. */
  time: number;
  text: string;
}

export interface LyricLine {
  time: number;
  text: string;
  /** Rendered underneath `text` and revealed at its own timestamp. */
  secondary?: LyricSpan;
}

export interface Lyrics {
  /** Timestamped lines, sorted ascending. Empty when the file has no timing. */
  timed: LyricLine[];
  /** Lines that carried no timestamp, kept for a static read-through fallback. */
  untimed: string[];
}

export const EMPTY_LYRICS: Lyrics = { timed: [], untimed: [] };

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const HAS_TIME_TAG = /\[\d{1,3}:\d{1,2}/;
const METADATA_TAG = /^\[(ar|ti|al|by|offset|re|ve|length):/i;

const DUET_MARKER = ">>";
const DUET_SEPARATOR = " | ";

/** `[02:03.4]` and `[02:03.400]` both mean 2 min 3.4 s. */
function toSeconds(match: RegExpExecArray): number {
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
  return minutes * 60 + seconds + fraction;
}

/**
 * Reads every timestamp on a line and pairs each with the line's text.
 * Returns an empty array for metadata, blank lines and tags without text.
 */
function parseSpans(rawLine: string): LyricSpan[] {
  const line = rawLine.trim();
  if (!line || METADATA_TAG.test(line)) return [];

  TIME_TAG.lastIndex = 0;
  const times: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = TIME_TAG.exec(line)) !== null) {
    times.push(toSeconds(match));
  }
  if (times.length === 0) return [];

  const text = line.replace(TIME_TAG, "").trim();
  if (!text) return [];

  return times.map((time) => ({ time, text }));
}

export function parseLyrics(source: string): Lyrics {
  const timed: LyricLine[] = [];
  const untimed: string[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || METADATA_TAG.test(line)) continue;

    if (line.startsWith(DUET_MARKER)) {
      const [lead, echo] = line.slice(DUET_MARKER.length).split(DUET_SEPARATOR);
      const leadSpans = lead ? parseSpans(lead) : [];
      const echoSpans = echo ? parseSpans(echo) : [];
      if (leadSpans.length > 0 && echoSpans.length > 0) {
        timed.push({
          time: leadSpans[0].time,
          text: leadSpans[0].text,
          secondary: echoSpans[0],
        });
        continue;
      }
      // Malformed duet line: fall through and treat it as an ordinary line.
    }

    if (!HAS_TIME_TAG.test(line)) {
      untimed.push(line);
      continue;
    }
    timed.push(...parseSpans(line));
  }

  timed.sort((a, b) => a.time - b.time);
  return { timed, untimed };
}

/**
 * Index of the line that should be highlighted at `time`, or -1 before the
 * first one. `lead` starts the highlight slightly early so the text is
 * readable by the time it is actually sung.
 */
export function findActiveLine(
  lines: LyricLine[],
  time: number,
  lead = 0.35,
): number {
  const threshold = time + lead;
  let low = 0;
  let high = lines.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >> 1;
    if (lines[middle].time <= threshold) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}
