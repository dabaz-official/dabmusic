/**
 * Generates waveform peaks for every track under public/music.
 *
 * Decodes each mp3 with a wasm mpg123 (no ffmpeg needed), mixes to mono,
 * buckets the absolute amplitude into a fixed number of peaks, normalises to
 * the track's own maximum and writes `<stem>.waveform.json` next to the
 * audio. The JSON files are committed; re-run `pnpm gen:waveforms` after
 * adding or replacing audio.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MPEGDecoder } from "mpg123-decoder";

const ROOT = join(process.cwd(), "public", "music");
const PEAK_COUNT = 400;

async function decodeToMono(buffer) {
  const decoder = new MPEGDecoder();
  await decoder.ready;
  try {
    const { channelData, samplesDecoded, sampleRate } = decoder.decode(buffer);
    if (samplesDecoded === 0) throw new Error("no samples decoded");
    const mono = new Float32Array(samplesDecoded);
    for (const channel of channelData) {
      for (let i = 0; i < samplesDecoded; i++) {
        mono[i] += channel[i] / channelData.length;
      }
    }
    return { mono, sampleRate };
  } finally {
    decoder.free();
  }
}

function computePeaks(mono) {
  const bucketSize = Math.floor(mono.length / PEAK_COUNT);
  if (bucketSize === 0) throw new Error("track too short to bucket");
  const peaks = new Array(PEAK_COUNT);
  let max = 0;
  for (let p = 0; p < PEAK_COUNT; p++) {
    const start = p * bucketSize;
    const end = p === PEAK_COUNT - 1 ? mono.length : start + bucketSize;
    let peak = 0;
    for (let i = start; i < end; i++) {
      const value = Math.abs(mono[i]);
      if (value > peak) peak = value;
    }
    peaks[p] = peak;
    if (peak > max) max = peak;
  }
  // Normalise to the track's own maximum so quiet masters still draw fully.
  return peaks.map((value) =>
    max === 0 ? 0 : Math.round((value / max) * 1000) / 1000,
  );
}

const albums = readdirSync(ROOT).filter((name) =>
  statSync(join(ROOT, name)).isDirectory(),
);

let generated = 0;
for (const album of albums) {
  const dir = join(ROOT, album);
  for (const file of readdirSync(dir)) {
    if (!file.toLowerCase().endsWith(".mp3")) continue;

    const stem = file.slice(0, -4);
    const outPath = join(dir, `${stem}.waveform.json`);
    const audio = readFileSync(join(dir, file));
    const { mono } = await decodeToMono(audio);
    const peaks = computePeaks(mono);
    writeFileSync(outPath, `${JSON.stringify({ peaks })}\n`);
    generated++;
    console.log(`${album}/${stem}: ${peaks.length} peaks`);
  }
}
console.log(`done — ${generated} waveform files`);
