"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
import { useState } from "react";

const THEMES = ["light", "dark", "system"] as const;
type UrlTheme = (typeof THEMES)[number];

function isTheme(value: string | null): value is UrlTheme {
  return value !== null && (THEMES as readonly string[]).includes(value);
}

/** Reads `?theme=` from the current URL, or undefined when absent/invalid. */
function readUrlTheme(): UrlTheme | undefined {
  if (typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get("theme");
  return isTheme(value) ? value : undefined;
}

/**
 * Applies `?theme=` before the first paint. next-themes' own inline script
 * runs first (it is rendered ahead of the children), so this one has the final
 * word; without it the force would only land in an effect, after the initial
 * frame. The value is re-checked here because the script string is static.
 */
const FORCE_SCRIPT = `(() => {
  try {
    const v = new URLSearchParams(location.search).get("theme");
    if (v !== "light" && v !== "dark" && v !== "system") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (v !== "system") {
      root.classList.add(v);
      root.style.colorScheme = v;
    } else {
      root.style.colorScheme = "";
    }
  } catch {}
})()`;

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  // Lazy initialiser: the value is known on the very first client render, with
  // no effect and no hydration mismatch (the server renders without it).
  // `forcedTheme` also stops next-themes from writing this override to
  // localStorage — it is a per-visit override, so dropping the parameter
  // returns the visitor to their own preference.
  const [urlTheme] = useState(readUrlTheme);

  return (
    <NextThemesProvider forcedTheme={urlTheme} {...props}>
      <script dangerouslySetInnerHTML={{ __html: FORCE_SCRIPT }} />
      {children}
    </NextThemesProvider>
  );
}
