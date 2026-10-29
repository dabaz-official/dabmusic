"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Carries an album page's colour out to the chrome it does not own.
 *
 * Two things live outside the page: the footer, whose band Apple paints as the
 * artwork tint stepped down by exactly 10 per channel rather than the neutral
 * shade, and the whole shell — sidebar and player included — which should sit
 * in the same mode as the page. The album's colour decides that mode: a pale
 * tint gets a light page, a deep one a dark page, in both site themes.
 *
 * So the page publishes `data-footer` and `data-mode` on its wrapper, and this
 * copies them onto `:root` / `<body>` after each navigation. It reads only the
 * *visible* wrapper: Next keeps the previous page mounted under
 * `display: none` (that is what makes back/forward instant), and its
 * attributes would otherwise win. The `MutationObserver` is there because an
 * album page can stream in after the route change has settled (its content sits
 * behind Suspense), and it lets go once the page has had time to land.
 */
export function AlbumFooterTint() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const apply = () => {
      const page = Array.from(
        document.querySelectorAll<HTMLElement>("[data-mode]"),
      ).find((element) => element.checkVisibility());
      const band = page?.dataset.footer;
      const mode = page?.dataset.mode;

      if (band) root.style.setProperty("--dz-album-footer", band);
      else root.style.removeProperty("--dz-album-footer");

      // Both classes go on and come off together: without an album page the
      // shell follows the site theme again.
      body.classList.toggle("light", mode === "light");
      body.classList.toggle("dark", mode === "dark");
    };

    apply();

    const observer = new MutationObserver(apply);
    const target = document.querySelector("main") ?? body;
    observer.observe(target, {
      attributes: true,
      attributeFilter: ["data-mode", "data-footer"],
      childList: true,
      subtree: true,
    });
    const settle = window.setTimeout(() => observer.disconnect(), 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, [pathname]);

  return null;
}
