/**
 * Dashboard Layout
 *
 * Protected layout for authenticated users.
 * Includes sidebar navigation and header.
 */

import { requireAuth } from "@/lib/dal/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This will redirect to /login if not authenticated
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - fixed on left */}
      <Sidebar />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-60">
        {/* Mobile nav - visible only on small screens */}
        <div className="fixed left-0 top-0 z-50 p-2 lg:hidden">
          <MobileNav />
        </div>

        {/* Header - sticky at top */}
        <Header user={user} />

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
