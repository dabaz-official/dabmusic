"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Gives the shared footer Apple's album-page band: their footer is the
 * artwork tint stepped down by exactly 10 per channel (measured `#2d1e11`
 * above `#231407`, `#0e0e0e` above `#040404`), where every other page keeps
 * the neutral shade.
 *
 * The footer lives in the site layout, outside the page that knows the tint,
 * so the page publishes the pair as data attributes on its wrapper and this
 * component moves them onto `:root`, where `--dz-footer-surface` in
 * globals.css prefers them over the neutral band.
 *
 * It reads only the *visible* wrapper: Next keeps the previous page mounted
 * under `display: none` (that is what makes back/forward instant), and its
 * attributes would otherwise win. The `MutationObserver` is there because an
 * album page can stream in after the route change has settled (its content
 * sits behind Suspense), and it lets go once the page has had time to land.
 */
const ATTRS = ["data-footer-dark", "data-footer-light"] as const;

export function AlbumFooterTint() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const page = Array.from(
        document.querySelectorAll<HTMLElement>("[data-footer-dark]"),
      ).find((element) => element.checkVisibility());

      const put = (name: string, value: string | undefined) => {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      };
      put("--dz-album-footer-dark", page?.dataset.footerDark);
      put("--dz-album-footer-light", page?.dataset.footerLight);
    };

    apply();

    const observer = new MutationObserver(apply);
    const target = document.querySelector("main") ?? document.body;
    observer.observe(target, {
      attributes: true,
      attributeFilter: [...ATTRS],
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
