import { SiteSidebar } from "@/components/site-sidebar";

// Site chrome: fixed-width sidebar plus content column. The /design test
// page stays outside this route group, per the phase-1 decision to keep it
// outside the navigation. Vertical page margins live here, locked to 40px
// to match the container's 40px horizontal gutters (both equal the sidebar
// logo's inset).
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <SiteSidebar />
      <main className="min-w-0 flex-1 py-10">{children}</main>
    </div>
  );
}
