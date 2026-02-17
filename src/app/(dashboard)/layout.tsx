/**
 * Dashboard Layout
 *
 * Protected layout for authenticated users.
 * Includes sidebar navigation and header.
 */

import { requireAllowedUser } from "@/lib/dal/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login if not authenticated, /unauthorized if not on whitelist
  const { user, role } = await requireAllowedUser();
  const isAdmin = role === "admin";

  const fullName = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const email = user.email || "";
  const displayName = fullName || email.split("@")[0] || "Użytkownik";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - fixed on left */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main content area - offset by sidebar width on desktop */}
      <div className="lg:pl-60">
        {/* Mobile nav - visible only on small screens */}
        <div className="fixed left-0 top-0 z-50 p-2 lg:hidden">
          <MobileNav isAdmin={isAdmin} />
        </div>

        {/* Header - sticky at top */}
        <Header
          email={email}
          displayName={displayName}
          avatarUrl={avatarUrl}
          initials={initials}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
