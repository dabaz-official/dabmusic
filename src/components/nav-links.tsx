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
      className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
        active
          ? "bg-(--dz-nav-active) font-semibold text-text-primary"
          : "font-normal text-text-secondary"
      }`}
    >
      <item.icon aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}
