import { Home, User } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dabaz", label: "DabAZ", icon: User },
] as const;

// Server component. Active-link highlighting would need usePathname (a
// client island) — deliberately deferred to keep the server boundary clean.
export function SiteSidebar() {
  return (
    <aside className="border-b border-border px-4 sm:px-6 md:sticky md:top-0 md:h-svh md:w-60 md:shrink-0 md:border-b-0 md:border-r lg:px-8">
      <div className="flex h-16 items-center justify-between md:h-auto md:flex-col md:items-stretch">
        <div className="flex h-16 items-center">
          <Link
            href="/"
            aria-label="DabMusic"
            className="flex items-center text-text-primary"
          >
            <Logo className="h-6 w-auto" />
          </Link>
        </div>
        <nav className="flex gap-1 md:mt-2 md:flex-col" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary md:h-10 md:px-4 md:py-0 md:text-base"
            >
              <item.icon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 md:h-5 md:w-5"
              />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
