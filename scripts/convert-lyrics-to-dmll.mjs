/**
 * Converts every shipped `.lrc` under public/music to DMLL and repoints the
 * album manifests at the new file.
 *
 * Word timing is estimated, not measured: every word on a line shares the gap
 * to the next line evenly, capped at WORD_SECONDS so a long instrumental break
 * does not drag the sweep. Parenthesised backing vocals become `[ad:]` lines on
 * their own, keeping their position on that same estimated timeline.
 *
 * A source with no timestamps at all (the Genius texts) becomes a text-only
 * DMLL file: without line times there is nothing to estimate from.
 *
 * One-shot migration; `pnpm gen:dmll` re-runs it over any .lrc left behind.
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parseLyrics } from "../src/lib/lrc.ts";

const MUSIC_ROOT = join(process.cwd(), "public", "music");

/** Estimated seconds per word when the line leaves room for it. */
const WORD_SECONDS = 0.28;
/** Window for the last line, which has no following line to stop it. */
const TAIL_SECONDS = 3;

const IS_SPACE = /\s/;
const IS_WORD = /[\p{L}\p{N}]/u;
const IS_CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const IS_INNER = /['’-]/;
const IS_PUNCTUATION = /[,.;:!?，。；：！？、]/;
/** Separators that a removed group can leave duplicated: `Ooh, (Phew), ooh`. */
const IS_SEPARATOR = /[,;，；]/;

/** `92.345` → `01:32.35`. */
function formatTime(seconds) {
  const total = Math.max(0, Math.round(seconds * 100));
  const minutes = Math.floor(total / 6000);
  const rest = total % 6000;
  return `${String(minutes).padStart(2, "0")}:${String(
    Math.floor(rest / 100),
  ).padStart(2, "0")}.${String(rest % 100).padStart(2, "0")}`;
}

/**
 * Splits `body` into the text that stays on the lyric line and the
 * parenthesised groups that become ad-libs. Every character keeps its source
 * index so the two streams can be merged back onto one timeline.
 */
function splitParentheticals(body) {
  const kept = [];
  const groups = [];
  /** True while a group is the first thing on the line: `(Yeah), Yeah, ...`. */
  let leadsWithGroup = false;
  let hasText = false;
  let index = 0;

  while (index < body.length) {
    const character = body[index];
    if (character === "(") {
      const close = body.indexOf(")", index + 1);
      if (close !== -1) {
        const text = body.slice(index + 1, close).trim();
        if (text) {
          if (!hasText) leadsWithGroup = true;
          groups.push({ text, index });
        }
        index = close + 1;
        continue;
      }
    }
    if (!IS_SPACE.test(character)) hasText = true;
    kept.push({ character, index });
    index += 1;
  }

  return { kept, groups, leadsWithGroup };
}

/**
 * Trims what removing a group leaves behind: doubled spaces, a space parked
 * before a comma, and the duplicated separator of `Ooh, (Phew), ooh`.
 */
function cleanKept(kept, leadsWithGroup) {
  const collapsed = [];
  for (const item of kept) {
    const last = collapsed[collapsed.length - 1];
    if (IS_SPACE.test(item.character) && last && IS_SPACE.test(last.character)) {
      continue;
    }
    collapsed.push(item);
  }

  // A space parked in front of punctuation reads as a hole once the group that
  // used to sit between them is gone.
  const tidied = [];
  for (const [position, item] of collapsed.entries()) {
    if (IS_SPACE.test(item.character)) {
      const next = collapsed
        .slice(position + 1)
        .find((entry) => !IS_SPACE.test(entry.character));
      if (next && IS_PUNCTUATION.test(next.character)) continue;
    }
    tidied.push(item);
  }

  const deduped = [];
  for (const item of tidied) {
    const previous = [...deduped]
      .reverse()
      .find((entry) => !IS_SPACE.test(entry.character));
    if (
      IS_SEPARATOR.test(item.character) &&
      previous &&
      previous.character === item.character
    ) {
      continue;
    }
    deduped.push(item);
  }

  let start = 0;
  if (leadsWithGroup) {
    while (start < deduped.length && !IS_WORD.test(deduped[start].character)) {
      start += 1;
    }
  }
  let end = deduped.length;
  while (end > start && IS_SPACE.test(deduped[end - 1].character)) end -= 1;
  return deduped.slice(start, end);
}

/**
 * One token per word for Latin text, one per character for CJK. Whitespace and
 * trailing punctuation stay on the preceding token, so joining the token texts
 * reproduces the line.
 */
function tokenize(characters) {
  const tokens = [];
  let open = false;
  let pending = "";

  for (const { character, index } of characters) {
    if (IS_SPACE.test(character)) {
      if (tokens.length > 0) tokens[tokens.length - 1].text += character;
      else pending += character;
      open = false;
      continue;
    }

    if (IS_CJK.test(character)) {
      tokens.push({ text: pending + character, index });
      pending = "";
      open = false;
      continue;
    }

    if (IS_WORD.test(character)) {
      if (open) tokens[tokens.length - 1].text += character;
      else {
        tokens.push({ text: pending + character, index });
        pending = "";
        open = true;
      }
      continue;
    }

    if (IS_INNER.test(character) && open) {
      tokens[tokens.length - 1].text += character;
      continue;
    }

    if (tokens.length > 0) tokens[tokens.length - 1].text += character;
    else pending += character;
    open = false;
  }

  if (pending && tokens.length > 0) tokens[tokens.length - 1].text += pending;
  return tokens;
}

/** Tokenizes a plain string, treating it as starting at source index 0. */
function tokenizeText(text, offset = 0) {
  return tokenize(
    [...text].map((character, index) => ({ character, index: offset + index })),
  );
}

/**
 * Splits one lyric line into its main text and ad-lib groups, then times every
 * token on a single even timeline from `start` to `end`.
 */
function splitLine(text, start, nextStart) {
  const window = Math.max(0, (nextStart ?? start + TAIL_SECONDS) - start);
  const whole = text.trim().match(/^\(([^()]*)\)$/);

  // A line that is only a backing vocal stays the lyric: demoting it would
  // shrink the whole hook into a dim ad-lib under the line above.
  let mainTokens;
  let adlibTokens;
  if (whole) {
    mainTokens = tokenizeText(whole[1].trim());
    adlibTokens = [];
  } else {
    const { kept, groups, leadsWithGroup } = splitParentheticals(text);
    mainTokens = tokenize(cleanKept(kept, leadsWithGroup));
    adlibTokens = groups
      .map((group) => ({ index: group.index, tokens: tokenizeText(group.text, group.index) }))
      .filter((group) => group.tokens.length > 0);
  }

  if (mainTokens.length === 0) {
    // Nothing outside the parentheses: the groups carry the line.
    mainTokens = adlibTokens.flatMap((group) => group.tokens);
    adlibTokens = [];
  }

  const ordered = [
    ...mainTokens,
    ...adlibTokens.flatMap((group) => group.tokens),
  ].sort((a, b) => a.index - b.index);

  const total = Math.min(window > 0 ? window : ordered.length * 0.2, ordered.length * WORD_SECONDS);
  const times = ordered.map((_, word) =>
    formatTime(start + (total * word) / ordered.length),
  );
  times.push(formatTime(start + total));

  const timing = new Map();
  ordered.forEach((token, word) => {
    timing.set(token, { time: times[word], endTime: times[word + 1] });
  });

  const word = (token) => `{${timing.get(token).time}~${timing.get(token).endTime}}${token.text}`;

  return {
    main: mainTokens.map(word).join(""),
    adlibs: adlibTokens.map((group) => ({
      time: timing.get(group.tokens[0]).time,
      text: group.tokens.map(word).join(""),
    })),
  };
}

function convert(source) {
  const byline = source.match(/^[ \t]*\[by:([^\]]*)\]/im)?.[1]?.trim();
  const { timed, untimed } = parseLyrics(source);

  const lines = ["[dmll:1]", ""];
  if (byline) lines.push(`// source: ${byline}`);
  lines.push(
    timed.length > 0
      ? "// word timings estimated from the line-level LRC; tweak by ear"
      : "// the source carried no line timing, so this file is text only",
    "",
  );

  let voice = "left";
  let adlibs = 0;
  for (const [index, line] of timed.entries()) {
    const nextStart = timed[index + 1]?.time;
    const split = splitLine(line.text, line.time, nextStart);

    if (line.voice !== voice) {
      voice = line.voice;
      lines.push(`[v:${voice}]`);
    }
    lines.push(`[${formatTime(line.time)}] ${split.main}`);
    for (const adlib of split.adlibs) {
      lines.push(`[ad:${adlib.time}] ${adlib.text}`);
      adlibs += 1;
    }
  }

  if (untimed.length > 0) lines.push(...untimed);
  return { content: `${lines.join("\n").trimEnd()}\n`, adlibs };
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let converted = 0;
for (const entry of readdirSync(MUSIC_ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const albumDir = join(MUSIC_ROOT, entry.name);
  const manifestPath = join(albumDir, "album.json");
  if (!existsSync(manifestPath)) continue;

  let manifestText = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);

  for (const track of manifest.tracks) {
    if (!track.lrc) continue;
    const lrcPath = join(albumDir, track.lrc);
    const dmllName = track.lrc.replace(/\.lrc$/i, ".dmll");
    const { content, adlibs } = convert(readFileSync(lrcPath, "utf8"));

    writeFileSync(join(albumDir, dmllName), content, "utf8");
    manifestText = manifestText.replace(
      new RegExp(`"lrc"\\s*:\\s*${escapeRegExp(JSON.stringify(track.lrc))}`),
      `"dmll": ${JSON.stringify(dmllName)}`,
    );
    if (!manifestText.includes(`"dmll": ${JSON.stringify(dmllName)}`)) {
      throw new Error(`could not repoint ${manifestPath} at ${dmllName}`);
    }
    rmSync(lrcPath);
    converted += 1;
    console.log(
      `${entry.name}/${track.file}: ${dmllName}${adlibs > 0 ? ` (${adlibs} ad-libs)` : ""}`,
    );
  }

  writeFileSync(manifestPath, manifestText, "utf8");
}

console.log(`\n${converted} lyric files converted.`);
