import { Home, User } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dabaz", label: "DabAZ", icon: User },
] as const;

// Server component, fixed 240px at every viewport — the owner wants the
// sidebar never to collapse or shrink with screen size. Active-link
// highlighting would need usePathname (a client island) — deliberately
// deferred to keep the server boundary clean.
export function SiteSidebar() {
  return (
    <aside className="sticky top-0 h-svh w-60 shrink-0 border-r border-border px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-stretch">
        <div className="flex h-16 items-center">
          <Link
            href="/"
            aria-label="DabMusic"
            className="flex items-center text-text-primary"
          >
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        {/* -mx-4 cancels the links' own padding so their text aligns
            flush with the logo's left edge; the hover background still gets
            its padding by bleeding into the aside's gutter. */}
        <nav className="-mx-4 mt-2 flex flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary md:h-12 md:gap-3 md:px-4 md:py-0 md:text-lg"
            >
              <item.icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 md:h-6 md:w-6"
              />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
