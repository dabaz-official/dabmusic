"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { SidebarNav } from "@/components/sidebar-nav";

// Client component: the sidebar's material depends on the route — opaque
// surface by default (same as the mini player), translucent with a heavy
// backdrop blur on album pages so the cover tint glows through (Apple-Music
// style vibrancy). The mobile logo is optically centred by a spacer that
// matches the menu button's width.
export function SiteSidebar() {
  const pathname = usePathname();
  const onAlbumPage = pathname.startsWith("/album");
  const [menuOpen, setMenuOpen] = useState(false);

  // Material recipe lifted from music.apple.com's own computed styles (bar
  // and mobile header both): a 60% translucent wash of gray-800 over
  // blur(16px) saturate(2.2) — plain blur averages the tint toward grey,
  // saturate() keeps it rich. Below sm content scrolls under the sticky top
  // bar, so it always keeps the blur; the desktop sidebar only needs it on
  // album pages, where the page tint sits behind it.
  const material = onAlbumPage
    ? "bg-surface-secondary/60 backdrop-blur-[16px] backdrop-saturate-[2.2]"
    : "bg-surface-secondary/60 backdrop-blur-[16px] backdrop-saturate-[2.2] sm:backdrop-blur-none sm:backdrop-saturate-100";

  return (
    <aside
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-[0.75px] ${menuOpen ? "border-b-transparent" : "border-b-(--dz-hairline)"} ${material} px-5
        sm:fixed sm:inset-y-0 sm:left-0 sm:h-auto sm:w-(--dz-sidebar-width) sm:flex-col sm:items-stretch sm:justify-start sm:border-b-0 sm:border-r-[0.75px] sm:border-r-(--dz-hairline) sm:px-9 sm:pt-8`}
    >
      <div className="w-10 sm:hidden" aria-hidden="true" />
      <Link
        href="/"
        aria-label="DabMusic"
        className="flex items-center text-text-primary"
      >
        <Logo className="h-5 w-auto" />
      </Link>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SidebarNav />
    </aside>
  );
}
