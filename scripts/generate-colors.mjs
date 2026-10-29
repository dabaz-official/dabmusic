/**
 * Generates one colour per album from its cover, Apple-Music style.
 *
 * For every album folder the cover is decoded with sharp, downscaled and
 * quantised; the bucket scored best by (pixel count × saturation) wins, with
 * near-black / near-white buckets skipped so cover backgrounds don't win.
 * The winner is converted to OKLCH and clamped into one band — pale for a
 * light bucket, deep for a dark one — so each album gets a single colour plus
 * the polarity it implies, and its page is painted in that colour in either
 * appearance, as Apple's album pages are. Written to `cover.color.json` next
 * to the cover. Files are committed; re-run `pnpm gen:colors` after replacing
 * a cover.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = join(process.cwd(), "public", "music");
const COVER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

/* ---------- OKLCH helpers (sRGB ⇄ OKLab ⇄ LCH) ---------- */

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v) {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

function oklabToLch(L, a, b) {
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

function lchToOklab(L, C, h) {
  const rad = (h * Math.PI) / 180;
  return {
    L,
    a: C * Math.cos(rad),
    b: C * Math.sin(rad),
  };
}

function oklabToSrgbHex({ L, a, b }) {
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  let r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  let g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  let bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;

  // Gamut mapping: pull chroma down until everything fits in sRGB.
  let chromaScale = 1;
  for (let i = 0; i < 24; i++) {
    const rr = linearToSrgb(r);
    const gg = linearToSrgb(g);
    const bb = linearToSrgb(bl);
    const inGamut =
      r >= 0 && r <= 1 &&
      g >= 0 && g <= 1 &&
      bl >= 0 && bl <= 1 &&
      rr >= 0 && gg >= 0 && bb >= 0 && (rr <= 255 && gg <= 255 && bb <= 255);
    if (inGamut) break;
    chromaScale *= 0.92;
    const rad = Math.atan2(b, a);
    a = chromaScale * Math.sqrt(a * a + b * b) * Math.cos(rad);
    b = chromaScale * Math.sqrt(a * a + b * b) * Math.sin(rad);
    const l2 = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m2 = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s2 = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    r = 4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2;
    g = -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2;
    bl = -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2;
  }

  const toHex = (v) => linearToSrgb(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/** Clamps L into a band and trims chroma, gamut-mapping on the way out. */
function tintedHex(lch, minL, maxL, maxC) {
  const L = Math.min(maxL, Math.max(minL, lch.L));
  const C = Math.min(maxC, lch.C);
  return oklabToSrgbHex(lchToOklab(L, C, lch.h));
}

/* ---------- colour extraction ---------- */

async function extractColor(coverPath) {
  const { data, info } = await sharp(coverPath)
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map();
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  let best = null;
  let bestScore = -1;
  for (const bucket of buckets.values()) {
    const r = bucket.r / bucket.count;
    const g = bucket.g / bucket.count;
    const b = bucket.b / bucket.count;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    // Skip near-black and near-white buckets — cover backgrounds dominate.
    if (max < 12 || max > 245) continue;
    const score = bucket.count * (0.2 + saturation);
    if (score > bestScore) {
      bestScore = score;
      best = { r, g, b };
    }
  }

  if (!best) return null;

  // Compute OKLCH from sRGB.
  const lr = srgbToLinear(best.r);
  const lg = srgbToLinear(best.g);
  const lb = srgbToLinear(best.b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  const oL = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const oa = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const ob = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const lch = oklabToLch(oL, oa, ob);
  return lch;
}

const albums = readdirSync(ROOT).filter((name) =>
  statSync(join(ROOT, name)).isDirectory(),
);

const coverFor = (dir) =>
  COVER_EXTENSIONS.map((ext) => `cover${ext}`).find((name) =>
    readdirSync(dir).includes(name),
  );

let generated = 0;
for (const album of albums) {
  const dir = join(ROOT, album);
  const cover = coverFor(dir);
  if (!cover) {
    console.warn(`${album}: no cover found, skipped`);
    continue;
  }

  const lch = await extractColor(join(dir, cover));
  if (!lch) {
    console.warn(`${album}: extraction produced nothing, skipped`);
    continue;
  }

  // One colour per album, and the colour decides the page's polarity: a
  // cover whose winning bucket is a light colour (L ≥ 0.5) gets a pale tint
  // and a light-mode page, a darker one gets the deep band and a dark-mode
  // page. Apple paints the album page in the artwork's own colour — their
  // measured background for a brown cover is #2d1e11, OKLCH L 0.25, and their
  // header carries `--dark-layout` for exactly that reason — so the band sits
  // up there with it rather than near black, which read as "almost the plain
  // page" instead of "this album's colour".
  const mode = lch.L >= 0.5 ? "light" : "dark";
  const color =
    mode === "light"
      ? tintedHex(lch, 0.9, 0.94, 0.04)
      : tintedHex(lch, 0.21, 0.28, 0.08);
  writeFileSync(
    join(dir, "cover.color.json"),
    `${JSON.stringify({ color, mode }, null, 2)}\n`,
  );
  generated++;
  console.log(
    `${album}: ${color} ${mode} (L ${lch.L.toFixed(3)}, C ${lch.C.toFixed(3)}, h ${lch.h.toFixed(0)})`,
  );
}
console.log(`done — ${generated} color files`);
