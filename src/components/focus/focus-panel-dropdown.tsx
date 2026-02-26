"use client";

/**
 * FocusPanelDropdown
 *
 * Main panel content used in both DropdownMenu (desktop)
 * and Sheet (mobile). Contains all focus controls.
 */

import { Separator } from "@/components/ui/separator";
import { PomodoroControls } from "./pomodoro-controls";
import { SoundMixer } from "./sound-mixer";
import { FocusModeToggle } from "./focus-mode-toggle";
import { SessionStatsWidget } from "./session-stats-widget";

export function FocusPanelContent() {
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Dzisiejsze statystyki
        </span>
        <SessionStatsWidget />
      </div>

      <Separator />

      {/* Pomodoro Timer */}
      <PomodoroControls />

      <Separator />

      {/* Sound Mixer */}
      <SoundMixer />

      <Separator />

      {/* Focus Mode */}
      <FocusModeToggle />
    </div>
  );
}
