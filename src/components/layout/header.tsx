/**
 * Dashboard Header
 *
 * Displays UserMenu with theme switcher and logout.
 * Receives serializable user data as props from layout.
 */

import { UserMenu } from "@/components/layout/user-menu";

interface HeaderProps {
  email: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
}

export function Header({ email, displayName, avatarUrl, initials }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 pl-16 lg:px-6 lg:pl-6">
      {/* Left side - can be used for breadcrumbs or page title */}
      <div />

      {/* Right side - user menu */}
      <UserMenu
        email={email}
        displayName={displayName}
        avatarUrl={avatarUrl}
        initials={initials}
      />
    </header>
  );
}
