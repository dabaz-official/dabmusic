/**
 * One home for the strings and the origin that metadata, the manifest, the
 * sitemap and robots.txt all have to agree on. The origin is the one the site
 * is deployed at; `metadataBase` and absolute URLs are built from it.
 */
export const SITE_URL = "https://music.dabaz.me";

export const SITE_NAME = "DabMusic";

export const SITE_DESCRIPTION = "I AM MUSIC.";

/** Colours for the browser/PWA chrome, matching `--dz-color-background`. */
export const PAGE_BACKGROUND = {
  light: "#ffffff",
  dark: "#1f1f1f",
} as const;
