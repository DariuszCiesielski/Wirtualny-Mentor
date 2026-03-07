"use client";

/**
 * Dashboard Header
 *
 * Displays FocusTimerWidget (left) and UserMenu (right).
 * Responds to focus mode by shrinking height.
 */

import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FocusTimerWidget } from "@/components/focus/focus-timer-widget";
import { PointsBadge } from "@/components/gamification/points-badge";
import { useFocusContextSafe } from "@/components/focus/focus-context";
import { cn } from "@/lib/utils";

interface HeaderProps {
  email: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
  isAdmin?: boolean;
}

export function Header({
  email,
  displayName,
  avatarUrl,
  initials,
  isAdmin,
}: HeaderProps) {
  const focus = useFocusContextSafe();
  const isFocusMode = focus?.focusMode.isFocusMode ?? false;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between border-b bg-background px-3 sm:px-4 lg:px-6 transition-[height] duration-300",
        isFocusMode ? "h-10" : "h-14 lg:h-16"
      )}
    >
      {/* Left side - Mobile nav + Focus Timer + Points */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="lg:hidden -ml-1">
          <MobileNav isAdmin={isAdmin} />
        </div>
        <FocusTimerWidget />
        <PointsBadge />
      </div>

      {/* Right side - user menu */}
      <div className={cn(isFocusMode && "scale-90 origin-right transition-transform duration-300")}>
        <UserMenu
          email={email}
          displayName={displayName}
          avatarUrl={avatarUrl}
          initials={initials}
        />
      </div>
    </header>
  );
}
