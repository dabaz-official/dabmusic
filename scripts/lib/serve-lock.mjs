/**
 * Shared state for the two things that both want `.next/`: a running server and
 * a build. `next build` wipes the directory out from under a live `next start`,
 * which keeps serving HTML that points at chunks that no longer exist — a white
 * page for the user and a clean 200 in the server log.
 *
 * So the running server drops a lock, and the build refuses while one is live.
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Outside `.next/` on purpose: a build would delete it otherwise. */
export const SERVE_LOCK = join(process.cwd(), ".serve.lock");
export const DEV_LOCK = join(process.cwd(), ".next", "dev", "lock");

/** Signal 0 probes existence. EPERM means it exists but belongs to someone else. */
export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

/** Reads a lock file, deleting it if the pid inside is gone. */
export function readLiveLock(file) {
  if (!existsSync(file)) return null;
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  if (!data?.pid) return null;
  if (!isAlive(data.pid)) {
    try {
      unlinkSync(file);
    } catch {
      /* another process cleaned it first */
    }
    return null;
  }
  return data;
}

export function acquireServeLock(port) {
  writeFileSync(
    SERVE_LOCK,
    JSON.stringify({ pid: process.pid, port, startedAt: new Date().toISOString() }, null, 2) + "\n",
  );
}

/** Only removes the lock if it is ours — a newer server may have taken over. */
export function releaseServeLock() {
  try {
    if (JSON.parse(readFileSync(SERVE_LOCK, "utf8")).pid === process.pid) unlinkSync(SERVE_LOCK);
  } catch {
    /* gone already */
  }
}
