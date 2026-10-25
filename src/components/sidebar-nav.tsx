"use client";

import { navItems, NavLink } from "@/components/nav-links";

// Desktop sidebar nav (hidden below sm — the mobile top bar's menu owns
// navigation there). -mx-2 cancels the links' px-2 so icons align flush
// with the logo's left edge; mt-8 matches the sidebar's 32px top padding,
// measured to the button box (not its icon content).
export function SidebarNav() {
  return (
    <nav
      className="hidden gap-1 sm:-mx-2 sm:mt-8 sm:flex sm:flex-col"
      aria-label="Primary"
    >
      {navItems.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
