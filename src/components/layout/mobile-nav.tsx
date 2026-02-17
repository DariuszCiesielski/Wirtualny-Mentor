'use client';

/**
 * Mobile Navigation Drawer
 *
 * Sheet-based navigation for mobile devices.
 * Appears as hamburger button, opens drawer from left side.
 * Touch targets are 44x44px minimum for accessibility.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Home, BookOpen, FileText, User, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    disabled: false,
  },
  {
    label: 'Moje kursy',
    href: '/courses',
    icon: BookOpen,
    disabled: false,
  },
  {
    label: 'Notatki',
    href: '/notes',
    icon: FileText,
    disabled: false,
  },
  {
    label: 'Profil',
    href: '/profile',
    icon: User,
    disabled: false,
  },
];

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const allNavItems = [
    ...navItems,
    ...(isAdmin
      ? [
          {
            label: 'Administracja',
            href: '/admin',
            icon: ShieldCheck,
            disabled: false,
          },
        ]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          aria-label="Otwórz menu nawigacji"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetHeader className="h-16 border-b px-6">
          <SheetTitle className="flex h-full items-center text-xl font-bold">
            Wirtualny Mentor
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-4">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.disabled ? '#' : item.href}
                onClick={() => {
                  if (!item.disabled) {
                    setOpen(false);
                  }
                }}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  item.disabled &&
                    'pointer-events-none cursor-not-allowed opacity-50'
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
      </SheetContent>
    </Sheet>
  );
}
