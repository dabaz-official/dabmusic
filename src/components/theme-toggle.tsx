"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

// SSR-safe "mounted" flag: server snapshot is false, client snapshot is true.
// avoids the set-state-in-effect pattern entirely.
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex gap-2 rounded-lg border border-border bg-surface p-1"
    >
      {themes.map((t) => {
        const selected = mounted && theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            disabled={!mounted}
            aria-pressed={mounted ? selected : undefined}
            onClick={() => setTheme(t.value)}
            className={`h-8 rounded-md px-3 text-sm ${
              selected
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
