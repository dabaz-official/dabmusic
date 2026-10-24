import { SiteSidebar } from "@/components/site-sidebar";

// Site chrome: fixed-width sidebar plus content column. The /design test
// page stays outside this route group, per the phase-1 decision to keep it
// outside the navigation. Vertical page margins live here and match the
// dz-container's horizontal gutters (24/32/48px at the same breakpoints).
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SiteSidebar />
      <main className="min-w-0 flex-1 py-6 sm:py-8 lg:py-12">{children}</main>
    </div>
  );
}
