"use client";

import { navItems, NavLink } from "@/components/nav-links";

// Desktop sidebar nav (hidden below sm — the mobile top bar's menu owns
// navigation there). mt-7 puts the first row at 80px from the sidebar top,
// matching music.apple.com; each row carries its own 4px bottom margin.
export function SidebarNav() {
  return (
    <nav
      className="hidden sm:mt-7 sm:flex sm:flex-col"
      aria-label="Primary"
    >
      {navItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
