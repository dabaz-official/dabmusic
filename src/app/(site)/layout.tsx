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
      <main className="min-w-0 flex-1 py-8 sm:ml-(--dz-sidebar-width)">
        {children}
      </main>
    </div>
  );
}
