"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dabaz", label: "DabAZ", icon: User },
] as const;

interface NavLinkProps {
  item: (typeof navItems)[number];
  /** Called after navigation (the mobile menu closes itself). */
  onNavigate?: () => void;
}

/**
 * One shared nav link: active route detection ("/" exact, others by prefix),
 * bold + surface highlight on the active item.
 */
export function NavLink({ item, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const active =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      // Sizes lifted from music.apple.com's nav items: 36px row (4px of
      // margin below), 7px inline padding, 24px icon with a 4px gap, and one
      // text colour for every row — selection is shown by the wash alone.
      className={`mb-1 flex h-9 items-center gap-1 rounded-md px-[7px] text-sm font-normal ${
        active ? "bg-(--dz-nav-active)" : ""
      }`}
      style={{ color: "var(--dz-nav-text)" }}
    >
      {/* Apple's icons live in a 24px box but leave ~4 units of padding, so
          their ink lands at 14–16px. Lucide's paths fill the canvas; 2px of
          padding puts our ink in the same range without changing the 24px
          box (so the row height and alignment are untouched). */}
      <item.icon aria-hidden="true" className="h-6 w-6 shrink-0 p-[2px]" />
      {item.label}
    </Link>
  );
}
