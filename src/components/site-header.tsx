import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

// Server component; ThemeToggle is the existing client island.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="dz-container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-[20px] font-semibold leading-7 text-text-primary"
        >
          DabMusic
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
