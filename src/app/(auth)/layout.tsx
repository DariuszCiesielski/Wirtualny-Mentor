/**
 * Auth Layout
 *
 * Centered layout for authentication pages (login, sign-up, etc.)
 * Does not include navigation or sidebar.
 */

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header with logo and theme toggle */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold transition-colors hover:text-primary"
        >
          <GraduationCap className="h-6 w-6" />
          <span>Wirtualny Mentor</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered content */}
      <main className="flex min-h-screen items-center justify-center p-4 pt-16">
        {children}
      </main>
    </div>
  );
}
