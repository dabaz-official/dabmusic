"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * True while the media query matches. Used where a breakpoint has to change
 * *behaviour* rather than styling — the full-screen player collapses downwards
 * below 1000px (Apple's sliding modal) and fades out above it, and `motion`
 * props cannot be expressed with a CSS breakpoint.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
