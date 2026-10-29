import type { MetadataRoute } from "next";

import { PAGE_BACKGROUND, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/**
 * Served at `/manifest.webmanifest` by Next's file convention, which also
 * links it from every page. The icons are generated from the owner's favicon
 * by `pnpm gen:icons`: the plain pair for launchers that respect the artwork's
 * own margins, and the maskable pair (inset to 78% on a plate) for the ones
 * that crop to their own shape.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "en",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: PAGE_BACKGROUND.light,
    theme_color: PAGE_BACKGROUND.light,
    categories: ["music", "entertainment"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
