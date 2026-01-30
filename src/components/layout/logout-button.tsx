"use client";

/**
 * Logout Button
 *
 * Client component that handles user logout.
 * Uses Server Action to sign out and redirect.
 */

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/logout/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">
        {isPending ? "Wylogowywanie..." : "Wyloguj"}
      </span>
    </Button>
  );
}
