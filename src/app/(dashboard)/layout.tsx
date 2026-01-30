/**
 * Dashboard Layout
 *
 * Protected layout for authenticated users.
 * Includes sidebar navigation and header.
 */

import { requireAuth } from "@/lib/dal/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

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

      {/* Main content area - offset by sidebar width */}
      <div className="pl-60">
        {/* Header - sticky at top */}
        <Header user={user} />

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
