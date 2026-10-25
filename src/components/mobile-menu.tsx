"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { navItems, NavLink } from "@/components/nav-links";

/**
 * The mobile menu: a button in the top bar and a panel that grows downward
 * from under the header to fill the screen. Height animates between two
 * explicit lengths; `visibility` rides the same transition so the collapsed
 * links are not focusable while staying visible during the collapse.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Menu"}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-10 w-10 items-center justify-center text-text-primary sm:hidden"
      >
        {open ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <Menu size={22} aria-hidden="true" />
        )}
      </button>

      <div
        className={`fixed inset-x-0 top-16 z-20 overflow-hidden bg-background transition-[height,visibility] duration-300 ease-out sm:hidden ${
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
            <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
      </div>
    </>
  );
}
