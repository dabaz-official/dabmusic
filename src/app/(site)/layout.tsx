import { SiteFooter } from "@/components/site-footer";
import { SiteSidebar } from "@/components/site-sidebar";

// Site chrome: below sm the sidebar is a sticky top bar above the content;
// from sm up it is fixed to the viewport, so the content column offsets
// itself by the same --dz-sidebar-width. The /design test page stays outside
// this route group, per the phase-1 decision to keep it outside the
// navigation. Vertical page margins live here, locked to 32px to match the
// container's 32px horizontal gutters.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SiteSidebar />
      {/* The chrome is always out of flow (`fixed`), so it never moves the
          content: the column carries its own offsets — 64px down for the
          mobile top bar, and the sidebar's width in from the left from the
          shell breakpoint up. The column also fills the viewport so the footer
          sits at the bottom on short pages, where `flex-1` on <main> absorbs
          the slack and the footer keeps its own 40px minimum gap. No bottom
          padding: the footer band runs to the page bottom and carries the
          space that clears the mini player. */}
      <div className="flex min-h-dvh flex-col shell:ml-(--dz-sidebar-width)">
        <main className="min-w-0 flex-1 pt-24 shell:pt-8">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
