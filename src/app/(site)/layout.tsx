import { AlbumFooterTint } from "@/components/album-footer-tint";
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
    <div className="dz-shell">
      <SiteSidebar />
      {/* The column spans the full window and runs *behind* the fixed
          sidebar; it is the container's left padding that keeps the content
          clear of it (see `dz-container`). That is what lets the sidebar's
          60% background actually show something through it, exactly as on
          Apple's pages. `--dz-sidebar-offset` is the same width as the
          sidebar, and zero below the shell breakpoint. The column also fills
          the viewport so the footer sits at the bottom on short pages, where
          `flex-1` on <main> absorbs the slack and the footer keeps its own
          40px minimum gap. No bottom padding: the footer band runs to the page
          bottom and carries the space that clears the mini player. */}
      <div className="flex min-h-dvh flex-col">
        <main className="min-w-0 flex-1 pt-24 shell:pt-8">{children}</main>
        {/* Keeps the footer band on the album page's own shade, which the
            page cannot set on the footer directly — it renders outside it. */}
        <AlbumFooterTint />
        <SiteFooter />
      </div>
    </div>
  );
}
