/**
 * LRC and DMLL parsing.
 *
 * Standard LRC, all in one pass:
 *   `[01:23.45] text`            — the common case
 *   `[01:23.45][01:27.10] text`  — one line reused at several timestamps
 *
 * DabMusic extensions; plain LRC files are unaffected:
 *   `[v:right]`                  — a standalone directive. Every following line
 *                                  sits on that side until the next directive;
 *                                  the default is the left.
 *   `[ad:00:03.00] text`         — an ad-lib under the previous timed line. It
 *                                  keeps its own reveal time and can repeat.
 *
 * DMLL word timing, for the Apple-Music-style sweep:
 *   `[00:12.34] {00:12.34~00:12.80}word {00:12.80~00:13.10}word`
 *
 * Each `{start~end}` covers the text that follows it, up to the next token.
 * Times are absolute. A line can mix timed and untimed text only through the
 * prefix rule: text before the first token runs from the line's timestamp to
 * the first token's start.
 *
 * A legacy two-vocal form still parses so old files keep working:
 *   `>> [00:01.00] a | [00:03.00] b` — `b` is rendered as an ad-lib under `a`.
 */

export type LyricVoice = "left" | "right";

export interface LyricWord {
  /** Seconds from the start of the track. */
  time: number;
  /** Seconds from the start of the track; always >= `time`. */
  endTime: number;
  /** The word or character, including any trailing space. */
  text: string;
}

export interface LyricSpan {
  /** Seconds from the start of the track. */
  time: number;
  text: string;
  /** Word timings for the sweep; absent keeps the line-level reveal. */
  words?: LyricWord[];
}

export interface LyricLine {
  time: number;
  text: string;
  /** Side the line sits on, set by the nearest `[v:...]` directive. */
  voice: LyricVoice;
  /** Rendered underneath `text`, each revealed at its own timestamp. */
  adlibs: LyricSpan[];
  /** Word timings for the sweep; absent keeps the line-level highlight. */
  words?: LyricWord[];
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
const METADATA_TAG = /^\[(ar|ti|al|by|offset|re|ve|length|dmll):/i;
const VOICE_DIRECTIVE = /^\[v:(left|right)\]$/i;
const ADLIB_LINE = /^\[ad:(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]\s*(.*)$/i;
const WORD_TAG =
  /\{(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?~(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\}/g;
const COMMENT = /^\/\//;

const DUET_MARKER = ">>";
const DUET_SEPARATOR = " | ";

/** `[02:03.4]` and `[02:03.400]` both mean 2 min 3.4 s. */
function toSecondsParts(
  minutes: string,
  seconds: string,
  fraction?: string,
): number {
  return (
    Number(minutes) * 60 +
    Number(seconds) +
    (fraction ? Number(`0.${fraction}`) : 0)
  );
}

function toSeconds(match: RegExpExecArray): number {
  return toSecondsParts(match[1], match[2], match[3]);
}

/** Every `[mm:ss.xx]` on a line, in source order. */
function extractTimes(line: string): number[] {
  TIME_TAG.lastIndex = 0;
  const times: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = TIME_TAG.exec(line)) !== null) {
    times.push(toSeconds(match));
  }
  return times;
}

/**
 * Reads every timestamp on a line and pairs each with the line's text.
 * Returns an empty array for metadata, blank lines and tags without text.
 */
function parseSpans(rawLine: string): LyricSpan[] {
  const line = rawLine.trim();
  if (!line || METADATA_TAG.test(line)) return [];

  const times = extractTimes(line);
  if (times.length === 0) return [];

  const text = line.replace(TIME_TAG, "").trim();
  if (!text) return [];

  return times.map((time) => ({ time, text }));
}

/**
 * Splits a DMLL body into timed words.
 *
 * `firstTime` anchors any text before the first token. The returned `text` is
 * the body with the tokens removed, so callers can use it for labels and the
 * line-level fallback.
 */
function parseWords(
  body: string,
  firstTime: number,
): { words: LyricWord[]; text: string } | undefined {
  WORD_TAG.lastIndex = 0;
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = WORD_TAG.exec(body)) !== null) {
    matches.push(match);
  }
  if (matches.length === 0) return undefined;

  const words: LyricWord[] = [];

  // Text before the first token is the first word, anchored on the line start.
  const prefix = body.slice(0, matches[0].index).replace(/^\s+/, "");
  if (prefix.trim()) {
    const firstWordTime = toSecondsParts(
      matches[0][1],
      matches[0][2],
      matches[0][3],
    );
    words.push({
      time: firstTime,
      endTime: Math.max(firstTime, firstWordTime),
      text: prefix,
    });
  }

  for (const [index, current] of matches.entries()) {
    const start = current.index + current[0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : body.length;
    const text = body.slice(start, end);
    if (!text.trim()) continue;

    const time = toSecondsParts(current[1], current[2], current[3]);
    const endTime = toSecondsParts(current[4], current[5], current[6]);
    words.push({ time, endTime: Math.max(time, endTime), text });
  }

  if (words.length === 0) return undefined;
  words.sort((a, b) => a.time - b.time);

  WORD_TAG.lastIndex = 0;
  return { words, text: body.replace(WORD_TAG, "").trim() };
}

/**
 * One source line may carry several timestamps. DMLL word times are written
 * against the first one and shifted for each repeat, so a chorus line can be
 * word-timed once.
 */
function parseTimedLine(line: string, voice: LyricVoice): LyricLine[] {
  const times = extractTimes(line);
  if (times.length === 0) return [];

  const body = line.replace(TIME_TAG, "").trim();
  if (!body) return [];

  const parsed = parseWords(body, times[0]);
  const text = parsed?.text ?? body;
  if (!text) return [];

  return times.map((time) => {
    const offset = time - times[0];
    return {
      time,
      text,
      voice,
      adlibs: [],
      words: parsed?.words.map((word) => ({
        ...word,
        time: word.time + offset,
        endTime: word.endTime + offset,
      })),
    };
  });
}

export function parseLyrics(source: string): Lyrics {
  const timed: LyricLine[] = [];
  const untimed: string[] = [];
  /** Current voice block; the file starts on the left unless told otherwise. */
  let voice: LyricVoice = "left";
  /** The line a following `[ad:]` attaches to. */
  let lastLine: LyricLine | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || COMMENT.test(line)) continue;

    const directive = VOICE_DIRECTIVE.exec(line);
    if (directive) {
      voice = directive[1].toLowerCase() === "right" ? "right" : "left";
      // An ad-lib belongs to the line directly above it, not across a block.
      lastLine = undefined;
      continue;
    }

    const adlib = ADLIB_LINE.exec(line);
    if (adlib) {
      const time = toSecondsParts(adlib[1], adlib[2], adlib[3]);
      const raw = adlib[4].trim();
      const parsed = parseWords(raw, time);
      const text = parsed?.text ?? raw;
      if (text && lastLine) {
        lastLine.adlibs.push({ time, text, words: parsed?.words });
      }
      continue;
    }

    if (METADATA_TAG.test(line)) continue;

    if (line.startsWith(DUET_MARKER)) {
      const [lead, echo] = line.slice(DUET_MARKER.length).split(DUET_SEPARATOR);
      const leadSpans = lead ? parseSpans(lead) : [];
      const echoSpans = echo ? parseSpans(echo) : [];
      if (leadSpans.length > 0 && echoSpans.length > 0) {
        const entry: LyricLine = {
          time: leadSpans[0].time,
          text: leadSpans[0].text,
          voice,
          adlibs: [echoSpans[0]],
        };
        timed.push(entry);
        lastLine = entry;
        continue;
      }
      // Malformed duet line: fall through and treat it as an ordinary line.
    }

    if (!HAS_TIME_TAG.test(line)) {
      untimed.push(line);
      continue;
    }

    for (const entry of parseTimedLine(line, voice)) {
      timed.push(entry);
      lastLine = entry;
    }
  }

  timed.sort((a, b) => a.time - b.time);
  for (const line of timed) line.adlibs.sort((a, b) => a.time - b.time);
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
