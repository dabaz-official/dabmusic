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
      {/* The column always fills the viewport, so the footer sits at the
          bottom even on short pages; `flex-1` on <main> absorbs the slack and
          the footer keeps its own 40px minimum gap. The 4rem subtraction is
          the mobile top bar, which is in flow — the desktop sidebar is fixed
          and out of it. No bottom padding here: the footer band runs to the
          page bottom and carries the space that clears the mini player. */}
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col shell:ml-(--dz-sidebar-width) shell:min-h-dvh">
        <main className="min-w-0 flex-1 pt-8">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
