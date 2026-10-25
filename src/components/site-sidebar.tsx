"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const material = onAlbumPage
    ? "bg-surface/60 backdrop-blur-2xl"
    : "bg-surface";

  return (
    <aside
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border ${material} px-5
        sm:fixed sm:inset-y-0 sm:left-0 sm:h-auto sm:w-(--dz-sidebar-width) sm:flex-col sm:items-stretch sm:justify-start sm:border-b-0 sm:border-r sm:px-9 sm:pt-8`}
    >
      <div className="w-10 sm:hidden" aria-hidden="true" />
      <Link
        href="/"
        aria-label="DabMusic"
        className="flex items-center text-text-primary"
      >
        <Logo className="h-5 w-auto" />
      </Link>
      <MobileMenu />
      <SidebarNav />
    </aside>
  );
}
