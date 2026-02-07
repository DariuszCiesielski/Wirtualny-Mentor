"use client";

/**
 * Sidebar Navigation
 *
 * Main navigation component for the dashboard.
 * Shows navigation links with active state highlighting.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    disabled: false,
  },
  {
    label: "Moje kursy",
    href: "/courses",
    icon: BookOpen,
    disabled: false,
  },
  {
    label: "Notatki",
    href: "/notes",
    icon: FileText,
    disabled: false,
  },
  {
    label: "Profil",
    href: "/profile",
    icon: User,
    disabled: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 border-r bg-background lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold">Wirtualny Mentor</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  item.disabled &&
                    "pointer-events-none opacity-50 cursor-not-allowed"
                )}
                aria-disabled={item.disabled}
                tabIndex={item.disabled ? -1 : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.disabled && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Wkrótce
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
