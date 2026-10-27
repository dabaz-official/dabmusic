"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { navItems, NavLink } from "@/components/nav-links";

// SSR-safe "mounted" flag: the portal target only exists in the browser.
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The mobile menu: a button in the top bar and a panel that grows downward
 * from under the header to fill the screen. Height animates between two
 * explicit lengths; `visibility` rides the same transition so the collapsed
 * links are not focusable while staying visible during the collapse.
 * Open state is owned by the sidebar, which drops its bottom hairline while
 * the panel is showing (the panel supplies its own edge there).
 *
 * The panel is portalled to <body>: the top bar carries its own
 * backdrop-filter, and a descendant of such an element can only sample that
 * ancestor's backdrop root — the panel would blur nothing and look flat.
 */
export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const mounted = useMounted();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const panel = (
    <div
      className={`fixed inset-x-0 top-16 z-20 overflow-hidden border-t-[0.75px] border-t-(--dz-hairline) bg-surface-secondary/60 backdrop-blur-[16px] backdrop-saturate-[2.2] transition-[height,visibility] duration-300 ease-out shell:hidden ${
        open ? "h-[calc(100dvh-4rem)] visible" : "h-0 invisible"
      }`}
    >
      <nav
        className={`flex flex-col gap-1 p-5 transition-[opacity,translate] duration-300 ease-out ${
          open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        aria-label="Primary"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onNavigate={() => onOpenChange(false)}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Menu"}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex h-10 w-10 items-center justify-center text-text-primary shell:hidden"
      >
        {open ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <Menu size={22} aria-hidden="true" />
        )}
      </button>

      {mounted ? createPortal(panel, document.body) : null}
    </>
  );
}
