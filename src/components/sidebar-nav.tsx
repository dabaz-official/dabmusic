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

  // -mx-3 cancels the links' px-3 so icons align flush with the logo's left
  // edge. mt-7 keeps the visual logo-to-icon gap at the sidebar's 36px
  // rhythm: the icons sit 8px inside the 40px buttons (28 + 8).
  return (
    <nav className="-mx-3 mt-7 flex flex-col gap-1" aria-label="Primary">
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
            className={`flex h-10 items-center gap-3 rounded-md px-3 text-lg font-medium ${
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
