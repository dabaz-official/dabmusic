import Link from "next/link";

import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { SidebarNav } from "@/components/sidebar-nav";

// Two shapes in one element: below sm a sticky top bar (logo centred, menu
// button at the far right) whose menu lives in <MobileMenu />; from sm up a
// sidebar fixed to the viewport edge — fixed (not sticky) so scroll-position
// rounding can never nudge it at the bottom of the page. The layout offsets
// the content column by the same --dz-sidebar-width. The mobile logo is
// optically centred by a spacer that matches the menu button's width.
export function SiteSidebar() {
  return (
    <aside
      className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-5
        sm:fixed sm:inset-y-0 sm:left-0 sm:h-auto sm:w-(--dz-sidebar-width) sm:flex-col sm:items-stretch sm:justify-start sm:border-b-0 sm:border-r sm:px-9 sm:pt-8"
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
