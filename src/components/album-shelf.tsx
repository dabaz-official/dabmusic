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
 * in on hover. Card sizing lives in the `dz-shelf` utilities.
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
  const touch = useTouchDevice();
  const revealed = touch || hovered;

  const update = useCallback(() => {
    const el = shelfRef.current;
    if (!el) return;
    // Snap points leave a few pixels of slack at either end.
    setAtStart(el.scrollLeft <= 24);
    setAtEnd(el.scrollWidth - el.clientWidth - el.scrollLeft <= 24);
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

  const arrow =
    "absolute top-1/2 flex h-[52px] w-7 -translate-y-1/2 items-center justify-center rounded-full bg-(--dz-arrow-bg) text-white backdrop-blur-[60px] backdrop-saturate-[1.8] transition-opacity focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div
      className={`relative ${className ?? ""}`}
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
        className={`${arrow} left-0 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <Chevron />
      </button>

      <button
        type="button"
        onClick={() => page(1)}
        aria-label="Next"
        disabled={atEnd}
        className={`${arrow} right-0 ${revealed ? "opacity-100" : "opacity-0"}`}
      >
        <Chevron mirrored />
      </button>
    </div>
  );
}
