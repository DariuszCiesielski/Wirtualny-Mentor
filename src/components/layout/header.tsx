/**
 * Dashboard Header
 *
 * Server Component that displays user info, theme toggle, and logout button.
 * Receives user data as prop from layout.
 */

import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";

interface HeaderProps {
  user: User;
}

function getInitials(name: string | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
}

export function Header({ user }: HeaderProps) {
  const fullName = user.user_metadata?.full_name as string | undefined;
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = fullName || user.email || "Uzytkownik";
  const initials = getInitials(fullName, user.email || "U");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 pl-16 lg:px-6 lg:pl-6">
      {/* Left side - can be used for breadcrumbs or page title */}
      <div />

      {/* Right side - user info, theme, logout */}
      <div className="flex items-center gap-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline-block">
            {displayName}
          </span>
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Logout */}
        <LogoutButton />
      </div>
    </header>
  );
}
