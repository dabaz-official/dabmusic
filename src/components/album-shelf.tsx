"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTouchDevice } from "@/lib/use-touch-device";

/** Apple's shelf chevron: a left-pointing 9x31 glyph. */
const CHEVRON =
  "M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.495l4.6 11.696Z";

/**
 * Apple's shelf arrows are one glyph: the left button draws it as-is, the right
 * one mirrors it with `scale: -1 1`. Both buttons exist at all times and are
 * `disabled` at their end of the row, which is how music.apple.com handles it —
 * nothing pops in and out of the layout.
 */
function Chevron({ mirrored }: { mirrored?: boolean }) {
  return (
    <svg
      viewBox="0 0 9 31"
      className={`h-4 w-auto${mirrored ? " -scale-x-100" : ""}`}
      aria-hidden="true"
    >
      <path d={CHEVRON} fill="currentColor" />
    </svg>
  );
}

/**
 * Album shelf: a horizontal row that scrolls sideways, with Apple's arrow pills
 * at both ends — 28x52, `blur(60px) saturate(1.8)` over a 50% surface, fading
 * in on hover, and only from 484px up (phones swipe the row themselves). Card
 * sizing lives in the `dz-shelf` utilities.
 *
 * Scrolling itself is the browser's native horizontal overflow, so dragging
 * works on touch devices without any gesture code — the same approach as
 * music.apple.com. On touch devices, which have no hover, the arrows are simply
 * always visible instead of fading in.
 */
export function AlbumShelf({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shelfRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [hovered, setHovered] = useState(false);
  /** Artwork height, so the arrows centre on the cover and not the card. */
  const [coverHeight, setCoverHeight] = useState(0);
  const touch = useTouchDevice();
  const revealed = touch || hovered;

  const update = useCallback(() => {
    const el = shelfRef.current;
    if (!el) return;
    // Snap points leave a few pixels of slack at either end.
    setAtStart(el.scrollLeft <= 24);
    setAtEnd(el.scrollWidth - el.clientWidth - el.scrollLeft <= 24);

    const cover = el.querySelector(".dz-shelf-item img");
    if (cover) setCoverHeight(cover.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    const el = shelfRef.current;
    if (!el) return;

    update();
    el.addEventListener("scroll", update, { passive: true });
    // Some webviews coalesce or drop `scroll`, so the listeners are not enough
    // on their own; poll while mounted instead of trusting the event.
    const poll = window.setInterval(update, 250);
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      window.clearInterval(poll);
      observer.disconnect();
    };
  }, [update]);

  const page = (direction: 1 | -1) => {
    const el = shelfRef.current;
    if (!el) return;

    const from = el.scrollLeft;
    el.scrollBy({ left: el.clientWidth * direction, behavior: "smooth" });

    // Some embedded webviews skip smooth scrolling entirely; if the position
    // has not budged shortly after, jump instead so the control always works.
    window.setTimeout(() => {
      if (Math.abs(el.scrollLeft - from) < 2) {
        el.scrollLeft = from + el.clientWidth * direction;
      }
    }, 220);
  };

  // Horizontal: each pill sits in its own gutter, centred between the edge
  // card and whatever bounds that side — so its distance to the artwork equals
  // its distance to that edge. The wrapper is full-bleed to the window, so the
  // right pill is measured from the window edge; the left one is measured past
  // the sidebar offset, since that is where the card column begins.
  // (`--dz-gutter` is 32px and the pill 28px, leaving 2px on each side.)
  //
  // Below the shell breakpoint (484px) the pills are gone: a phone swipes the
  // row itself, and the 28px pill would eat a third of the card it sits beside.
  const arrow =
    "absolute hidden h-[52px] w-7 -translate-y-1/2 items-center justify-center rounded-full bg-(--dz-arrow-bg) text-(--dz-arrow-fg) backdrop-blur-[60px] backdrop-saturate-(--dz-arrow-saturate) transition-opacity focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0 shell:flex";
  const gutterInset = "calc((var(--dz-gutter) - 28px) / 2)";
  // The left pill is placed inside the content area, i.e. past the gutter and
  // the sidebar, and pulled back into the gutter by its own width plus the
  // inset.
  const leftInset = `calc(var(--dz-gutter) + var(--dz-sidebar-offset, 0px) - 28px - ${gutterInset})`;
  // Vertical: centre on the artwork. Falls back to the shelf centre until the
  // first measurement lands.
  const arrowTop = coverHeight > 0 ? coverHeight / 2 : undefined;

  return (
    <div
      // Full-bleed to the window edges — both of them, so cards the user
      // scrolls past travel under the sidebar (see `dz-shelf-bleed`).
      className={`relative dz-shelf-bleed ${className ?? ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div ref={shelfRef} className="dz-shelf">
        {children}
      </div>

      <button
        type="button"
        onClick={() => page(-1)}
        aria-label="Previous"
        disabled={atStart}
        style={{ top: arrowTop, left: leftInset }}
        className={`${arrow} ${arrowTop === undefined ? "top-1/2" : ""} ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <Chevron />
      </button>

      <button
        type="button"
        onClick={() => page(1)}
        aria-label="Next"
        disabled={atEnd}
        style={{ top: arrowTop, right: gutterInset }}
        className={`${arrow} ${arrowTop === undefined ? "top-1/2" : ""} ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <Chevron mirrored />
      </button>
    </div>
  );
}
