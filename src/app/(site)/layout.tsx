import { SiteSidebar } from "@/components/site-sidebar";

// Site chrome: sidebar plus content column. The /design test page stays
// outside this route group, per the phase-1 decision to keep it outside
// the navigation.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="md:flex">
      <SiteSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
