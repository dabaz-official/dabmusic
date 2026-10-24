"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dabaz", label: "DabAZ", icon: User },
] as const;

// Client island: the active link needs usePathname. "/" matches exactly;
// other routes match by prefix so future nested routes (e.g. album pages)
// keep their parent highlighted.
export function SidebarNav() {
  const pathname = usePathname();

  // -mx-2 cancels the links' px-2 so icons align flush with the logo's left
  // edge. mt-6.5 keeps the visual logo-to-icon gap at the sidebar's 36px
  // rhythm: the icons sit 10px inside the auto-height buttons (26 + 10;
  // the inset derives from the 28px text line box, not the 24px icon).
  return (
    <nav className="-mx-2 mt-6.5 flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-2 py-2 text-lg font-medium ${
              active
                ? "bg-surface-secondary text-text-primary"
                : "text-text-secondary"
            }`}
          >
            <item.icon aria-hidden="true" className="h-6 w-6 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
