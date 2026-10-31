#!/usr/bin/env node
/**
 * Production start, with the build order welded shut.
 *
 * Why this exists: `next dev` leaves a .next/ directory without a BUILD_ID, so
 * `next start` afterwards dies with "Could not find a production build", and a
 * BUILD_ID left over from an older run will happily serve a stale build. Ordering
 * that by hand is exactly the kind of thing people forget at 2am, so it lives here.
 *
 * Rules:
 *   1. A live dev server blocks the start (it owns :3000 and its own .next/dev state).
 *   2. No BUILD_ID, or a BUILD_ID older than the newest source file -> build first.
 *   3. Then hand over to `next start`.
 *
 * Env: PORT (default 3000), HOSTNAME (passed through to next start).
 * Usage: pnpm start
 */
import { spawn, execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  DEV_LOCK,
  SERVE_LOCK,
  acquireServeLock,
  readLiveLock,
  releaseServeLock,
} from "./lib/serve-lock.mjs";

const root = process.cwd();
const nextDir = join(root, ".next");
const buildIdPath = join(nextDir, "BUILD_ID");
const devLockPath = DEV_LOCK;
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT || "3000";

const SOURCE_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".css", ".json", ".mp3", ".lrc", ".jpg", ".jpeg", ".png", ".webp", ".svg",
]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "scripts"]);

function die(msg) {
  console.error(`\n[start] ${msg}\n`);
  process.exit(1);
}

if (!existsSync(nextBin)) {
  die(`next 没装：找不到 ${nextBin}。先 pnpm install --frozen-lockfile。`);
}

// 1. dev server guard ------------------------------------------------------
function liveDevServer() {
  if (!existsSync(devLockPath)) return null;
  let lock;
  try {
    lock = JSON.parse(readFileSync(devLockPath, "utf8"));
  } catch {
    return null; // unreadable lock: nothing reliable to assert, fall through
  }
  if (!lock?.pid) return null;
  try {
    process.kill(lock.pid, 0);
    return lock;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else.
    return err.code === "EPERM" ? lock : null;
  }
}

const dev = liveDevServer();
if (dev) {
  die(
    `dev server 还活着（pid ${dev.pid}, :${dev.port}）。它和 prod build 共用 .next/，` +
      `现在 build 出来的东西会被它写脏。\n` +
      `先把 dev 停掉（Ctrl-C 那个窗口），再 pnpm start。`,
  );
}

// A second prod on the same .next/ is just as bad: whichever builds next pulls
// the chunks out from under the other one.
const serving = readLiveLock(SERVE_LOCK);
if (serving) {
  die(
    `已经有一个 prod 在跑（pid ${serving.pid}, :${serving.port}，${serving.startedAt}）。\n` +
      `两个 next start 共用一个 .next/ 迟早互相踩。先停掉那个，再 pnpm start。`,
  );
}

// 2. is the build missing or stale? ---------------------------------------
function newestSourceMtime(dir, newest = 0) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return newest;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      newest = newestSourceMtime(p, newest);
    } else if (SOURCE_EXT.has(e.name.slice(e.name.lastIndexOf(".")))) {
      const m = statSync(p).mtimeMs;
      if (m > newest) newest = m;
    }
  }
  return newest;
}

let reason = null;
if (!existsSync(buildIdPath)) {
  reason = "没有 .next/BUILD_ID（多半是 dev 或首次 clone 后的残局）";
} else if (newestSourceMtime(root) > statSync(buildIdPath).mtimeMs) {
  reason = "BUILD_ID 比最新的源码还旧，产物是陈的";
}

if (reason) {
  console.log(`[start] 需要先 build：${reason}`);
  console.log(`[start] next build ...`);
  execFileSync(process.execPath, [nextBin, "build"], { stdio: "inherit", cwd: root });
  if (!existsSync(buildIdPath)) die("build 跑完了还是没有 BUILD_ID，说明 build 本身有问题。");
  console.log(`[start] build ok (BUILD_ID ${readFileSync(buildIdPath, "utf8").trim()})`);
} else {
  console.log(`[start] 已有新鲜产物（BUILD_ID ${readFileSync(buildIdPath, "utf8").trim()}），跳过 build`);
}

// 3. start -----------------------------------------------------------------
acquireServeLock(port);
console.log(`[start] next start -p ${port}`);
const child = spawn(
  process.execPath,
  [nextBin, "start", "-p", port, ...(process.env.HOSTNAME ? ["-H", process.env.HOSTNAME] : [])],
  { stdio: "inherit", cwd: root },
);
child.on("exit", (code, signal) => {
  releaseServeLock();
  process.exit(signal ? 1 : code ?? 0);
});
child.on("error", (err) => {
  releaseServeLock();
  console.error(`[start] next start 起不来：${err.message}`);
  process.exit(1);
});
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    releaseServeLock();
    child.kill(sig);
  });
}
