/**
 * Generates the install and share artwork from the owner's single favicon.
 *
 * `public/favicon.png` is a 512px white plate with the mark on it, so every
 * icon is derived rather than drawn twice:
 *
 * - `public/icons/icon-{192,512}.png` — the plate as-is (purpose `any`).
 * - `public/icons/icon-maskable-{192,512}.png` — the same art inset to 78% on
 *   a white canvas, which puts the mark at ~59% of the square, inside the
 *   maskable safe circle (the circle is 80% of the canvas) no matter which
 *   shape a launcher crops it to.
 * - `public/apple-icon.png` — 180px, linked from `metadata.icons.apple`.
 * - `public/og.png` — a 1200×630 plate for the site-level link preview; each
 *   album page previews with its own cover instead.
 *
 * Committed output: re-run `pnpm gen:icons` after the favicon changes.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = join("public", "favicon.png");
const MASKABLE_INSET = 0.78;
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const { width, height } = await sharp(SRC).metadata();
if (width !== height) {
  throw new Error(`favicon must be square, got ${width}x${height}`);
}

mkdirSync(join("public", "icons"), { recursive: true });

const resized = (size) =>
  sharp(SRC).resize(size, size, { fit: "cover" }).png();

for (const size of [192, 512]) {
  await resized(size).toFile(join("public", "icons", `icon-${size}.png`));

  const inset = Math.round(size * MASKABLE_INSET);
  const mark = await sharp(SRC).resize(inset, inset, { fit: "cover" }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(join("public", "icons", `icon-maskable-${size}.png`));
}

await resized(180).toFile(join("public", "apple-icon.png"));

// The mark is the favicon minus its plate, so draw the plate around it here.
const ogMark = await sharp(SRC)
  .resize(Math.round(630 * 0.5), Math.round(630 * 0.5), { fit: "cover" })
  .png()
  .toBuffer();
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: WHITE },
})
  .composite([{ input: ogMark, gravity: "centre" }])
  .png()
  .toFile(join("public", "og.png"));

console.log(
  `icons: 192/512 + maskable, apple-icon 180, og 1200×630 (from a ${width}px favicon)`,
);
