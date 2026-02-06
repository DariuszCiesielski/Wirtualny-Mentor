"use client";

import { useTransition } from "react";
import { useTheme } from "next-themes";
import { ChevronDown, LogOut, Palette, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeOptions } from "@/lib/themes";
import { logout } from "@/app/(auth)/logout/actions";

interface UserMenuProps {
  email: string;
  displayName: string;
  avatarUrl?: string;
  initials: string;
}

function ThemeColorPreview({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <div className="flex gap-0.5 shrink-0">
      <div className="w-3 h-3 rounded-l-sm" style={{ backgroundColor: colors[0] }} />
      <div className="w-3 h-3" style={{ backgroundColor: colors[1] }} />
      <div className="w-3 h-3 rounded-r-sm border border-border" style={{ backgroundColor: colors[2] }} />
    </div>
  );
}

export function UserMenu({ email, displayName, avatarUrl, initials }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  const currentThemeOption = themeOptions.find((t) => t.id === theme) ?? themeOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent">
          <Avatar size="sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline-block max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* User info */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Theme submenu */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="h-4 w-4" />
              <span className="flex-1">Motyw</span>
              <ThemeColorPreview colors={currentThemeOption.colors} />
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                >
                  <ThemeColorPreview colors={option.colors} />
                  <div className="flex-1">
                    <p className="text-sm">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {theme === option.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" />
          {isPending ? "Wylogowywanie..." : "Wyloguj"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
