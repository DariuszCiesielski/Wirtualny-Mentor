"use client";

/**
 * Theme Toggle
 *
 * Dropdown button for switching between 6 themes.
 * Used on pages without UserMenu (landing, auth).
 */

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeOptions } from "@/lib/themes";

function ThemeColorPreview({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      <div className="w-3 h-3 rounded-l-sm" style={{ backgroundColor: colors[0] }} />
      <div className="w-3 h-3" style={{ backgroundColor: colors[1] }} />
      <div className="w-3 h-3 rounded-r-sm border border-border" style={{ backgroundColor: colors[2] }} />
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Palette className="h-5 w-5" />
        <span className="sr-only">Zmień motyw</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Zmień motyw</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => setTheme(option.id)}
          >
            <ThemeColorPreview colors={option.colors} />
            <span className="flex-1 text-sm">{option.name}</span>
            {theme === option.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
