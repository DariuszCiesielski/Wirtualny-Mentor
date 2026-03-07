/**
 * Dashboard Layout
 *
 * Protected layout for authenticated users.
 * Includes sidebar navigation, header, and FocusProvider.
 */

import { requireAllowedUser } from "@/lib/dal/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

import { FocusShell } from "@/components/focus/focus-shell";
import { FocusContentArea } from "@/components/focus/focus-content-area";

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
    <FocusShell>
      <div className="min-h-screen bg-background">
        {/* Sidebar - fixed on left, hides in focus mode */}
        <Sidebar isAdmin={isAdmin} />

        {/* Main content area - offset by sidebar width on desktop */}
        <FocusContentArea>
          {/* Header - sticky at top (includes MobileNav on small screens) */}
          <Header
            email={email}
            displayName={displayName}
            avatarUrl={avatarUrl}
            initials={initials}
            isAdmin={isAdmin}
          />

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </FocusContentArea>
      </div>
    </FocusShell>
  );
}
