#!/usr/bin/env node
/**
 * `pnpm build`, with the one rule that keeps a live site from going white:
 * never rebuild `.next/` while something is serving it or developing in it.
 *
 * `next build` replaces the directory wholesale. A running `next start` holds
 * the previous manifests in memory, so it keeps handing out HTML that references
 * chunk files the new build deleted. Server logs stay clean and the browser
 * shows nothing.
 *
 * Escape hatch: SERVE_LOCK_IGNORED=1 (for the person who really means it).
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { DEV_LOCK, SERVE_LOCK, readLiveLock } from "./lib/serve-lock.mjs";

const root = process.cwd();
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const ignore = process.env.SERVE_LOCK_IGNORED === "1";

if (!existsSync(nextBin)) {
  console.error(`\n[build] next 没装：找不到 ${nextBin}。先 pnpm install --frozen-lockfile。\n`);
  process.exit(1);
}

if (!ignore) {
  const serving = readLiveLock(SERVE_LOCK);
  if (serving) {
    console.error(
      `\n[build] 拒绝构建：:${serving.port} 上有服务正在用 .next/（pid ${serving.pid}，${serving.startedAt}）。\n` +
        `重建会把正在跑的站点的 chunk 换掉，用户那边是白屏，日志里什么都看不见。\n` +
        `先停掉那个服务（或换个目录 build）；确实要硬来，用 SERVE_LOCK_IGNORED=1。\n`,
    );
    process.exit(1);
  }

  const dev = readLiveLock(DEV_LOCK);
  if (dev) {
    console.error(
      `\n[build] 拒绝构建：dev server 还活着（pid ${dev.pid}, :${dev.port}）。\n` +
        `dev 和 build 共用 .next/，现在 build 会把它写脏。先停 dev。\n`,
    );
    process.exit(1);
  }
}

execFileSync(process.execPath, [nextBin, "build"], { stdio: "inherit", cwd: root });
