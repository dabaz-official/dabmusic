"use client";

import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { SidebarNav } from "@/components/sidebar-nav";

// Client component (it owns the mobile menu state). The material matches
// music.apple.com's bar in both themes; the mobile logo is optically centred
// by a spacer that matches the menu button's width.
export function SiteSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Material taken verbatim from music.apple.com: a 60% wash over
  // blur(16px) saturate(2.2), always on — the blur is what keeps the page
  // tint (and scrolling content on mobile) readable through the bar.
  const material =
    "bg-(--dz-shell-bg)/100 backdrop-blur-[16px] backdrop-saturate-[2.2]";

  return (
    <aside
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b-[0.75px] ${menuOpen ? "border-b-transparent" : "border-b-(--dz-hairline)"} ${material} px-5
        sm:fixed sm:inset-y-0 sm:left-0 sm:h-auto sm:w-(--dz-sidebar-width) sm:flex-col sm:items-stretch sm:justify-start sm:border-b-0 sm:border-r-[0.75px] sm:border-r-(--dz-hairline) sm:pt-8 sm:pr-3 sm:pl-5`}
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
