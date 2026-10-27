"use client";

import { useSyncExternalStore } from "react";

/**
 * True when the device has no hover, so hover-revealed affordances would
 * never appear. Two signals, both needed:
 *
 * - `(hover: none)` catches phones and tablets in general.
 * - `maxTouchPoints` catches **iPadOS**, which reports a `Macintosh` user
 *   agent and would otherwise look like a desktop — the same trick Apple's own
 *   site uses. A touchscreen laptop keeps `(hover: hover)`, so it is not
 *   mistaken for a tablet.
 */
function subscribe(listener: () => void) {
  const query = window.matchMedia("(hover: none)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function getSnapshot() {
  const ipadOS =
    navigator.maxTouchPoints >= 2 && /Macintosh/.test(navigator.userAgent);
  return ipadOS || window.matchMedia("(hover: none)").matches;
}

/** Server snapshot is `false`: the reveal-on-hover default. */
export function useTouchDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
