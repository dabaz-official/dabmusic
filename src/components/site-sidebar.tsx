import Link from "next/link";

import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";

// Server component; the nav list below the logo is a client island
// (src/components/sidebar-nav.tsx) because active-link highlighting needs
// usePathname.
export function SiteSidebar() {
  return (
    <aside className="sticky top-0 h-svh w-80 shrink-0 border-r border-border p-9">
      <Link
        href="/"
        aria-label="DabMusic"
        className="flex items-center text-text-primary"
      >
        <Logo className="h-6 w-auto" />
      </Link>
      <SidebarNav />
    </aside>
  );
}
