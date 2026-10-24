import { Home, User } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dabaz", label: "DabAZ", icon: User },
] as const;

// Server component, fixed 240px at every viewport — the owner wants the
// sidebar and its nav links to look identical at any screen size (mobile
// adaptation is deliberately deferred). Active-link highlighting would need
// usePathname (a client island) — deliberately deferred to keep the server
// boundary clean.
export function SiteSidebar() {
  return (
    <aside className="sticky top-0 h-svh w-60 shrink-0 border-r border-border p-12">
      <Link
        href="/"
        aria-label="DabMusic"
        className="flex items-center text-text-primary"
      >
        <Logo className="h-6 w-auto" />
      </Link>
        {/* -mx-4 cancels the links' own padding so their text aligns
            flush with the logo's left edge; the hover background still gets
            its padding by bleeding into the aside's gutter. mt-12 keeps the
            logo-to-nav gap equal to the 48px page margin above the logo. */}
        <nav className="-mx-4 mt-12 flex flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-12 items-center gap-3 rounded-md px-4 text-lg font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
            >
              <item.icon aria-hidden="true" className="h-6 w-6 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
    </aside>
  );
}
