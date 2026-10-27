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
        shell:fixed shell:inset-y-0 shell:left-0 shell:h-auto shell:w-(--dz-sidebar-width) shell:flex-col shell:items-stretch shell:justify-start shell:border-b-0 shell:border-r-[0.75px] shell:border-r-(--dz-hairline) shell:pt-8 shell:pr-3 shell:pl-5`}
    >
      <div className="w-10 shell:hidden" aria-hidden="true" />
      {/* The 7px inline padding matches a nav row's own padding, so the logo
          and the nav icons share a left edge (Apple: 28 vs 26). */}
      <Link
        href="/"
        aria-label="DabMusic"
        className="flex items-center px-[7px] text-text-primary"
      >
        {/* The D mark fills 160 of the viewBox's 224 units and the "i" dot
            sits at the very top: 25px overall puts the mark at 18px, and the
            -7px pull (64/224 of 25px) keeps the mark's top edge on the 32px
            line the previous logo used. */}
        <Logo className="-mt-[7px] h-[25px] w-auto" />
      </Link>
      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <SidebarNav />
    </aside>
  );
}
