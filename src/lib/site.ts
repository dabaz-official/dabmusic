/**
 * One home for the strings and the origin that metadata, the manifest, the
 * sitemap and robots.txt all have to agree on. The origin is the one the site
 * is deployed at; `metadataBase` and absolute URLs are built from it.
 */
export const SITE_URL = "https://music.dabaz.me";

export const SITE_NAME = "DabMusic";

export const SITE_DESCRIPTION = "I AM MUSIC.";

/** The page itself, matching `--dz-color-background`. */
export const PAGE_BACKGROUND = {
  light: "#ffffff",
  dark: "#1f1f1f",
} as const;

/**
 * The site header as it actually renders — the browser's `theme-color` (and the
 * PWA toolbar) uses this rather than the page background, so the chrome above
 * the page matches the bar below it. Measured from a screenshot of the header
 * at 375px: `--dz-shell-bg` (60% #f5f5f5) over a white page is #f9f9f9, and
 * its dark counterpart (60% #262628) over #1f1f1f is #232324.
 */
export const CHROME_BACKGROUND = {
  light: "#f9f9f9",
  dark: "#232324",
} as const;
