"use client";

/**
 * FocusTimerWidget
 *
 * Compact timer widget for the header bar.
 * Desktop: DropdownMenu with full controls.
 * Mobile: Sheet (bottom drawer).
 */

import { useState } from "react";
import { Timer, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFocusContext } from "./focus-context";
import { FocusPanelContent } from "./focus-panel-dropdown";
import { cn } from "@/lib/utils";

function formatTimeCompact(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CompactTimerDisplay() {
  const { pomodoro } = useFocusContext();
  const { state, config } = pomodoro;
  const isActive = state.phase !== "idle";
  const isBreak =
    state.phase === "short_break" || state.phase === "long_break";

  return (
    <div className="flex items-center gap-1.5">
      <Timer
        className={cn(
          "h-4 w-4",
          isActive && state.isRunning && "text-primary",
          isBreak && "text-green-500"
        )}
      />
      {isActive ? (
        <span
          className={cn(
            "text-sm font-mono tabular-nums font-medium",
            isBreak && "text-green-500"
          )}
        >
          {formatTimeCompact(state.timeLeft)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {formatTimeCompact(config.workMinutes * 60)}
        </span>
      )}
    </div>
  );
}

export function FocusTimerWidget() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
            <CompactTimerDisplay />
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-4">
          <FocusPanelContent />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Mobile: Sheet
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 h-8 px-2"
        onClick={() => setMobileOpen(true)}
      >
        <CompactTimerDisplay />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetTitle>Focus Panel</SheetTitle>
          <div className="mt-4">
            <FocusPanelContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
