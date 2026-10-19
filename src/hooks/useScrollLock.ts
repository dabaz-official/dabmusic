'use client';

import { useEffect } from 'react';

/**
 * Freezes the page behind a full-screen overlay without losing the scroll
 * position, which `overflow: hidden` alone does not do on iOS.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const { style } = document.body;
    const previous = { position: style.position, top: style.top, width: style.width };
    const scrollY = window.scrollY;

    style.position = 'fixed';
    style.top = `-${scrollY}px`;
    style.width = '100%';

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
