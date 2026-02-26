"use client";

/**
 * PomodoroControls
 *
 * Timer display with circular progress, start/pause/reset buttons.
 * Used inside FocusPanelDropdown.
 */

import { Play, Pause, RotateCcw, SkipForward, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusContext } from "./focus-context";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case "work":
      return "Praca";
    case "short_break":
      return "Krótka przerwa";
    case "long_break":
      return "Długa przerwa";
    default:
      return "Gotowy";
  }
}

export function PomodoroControls() {
  const {
    pomodoro,
    handleStartWork,
    handleStartBreak,
    handlePause,
    handleResume,
    handleReset,
  } = useFocusContext();

  const { state, skip } = pomodoro;
  const progress =
    state.totalTime > 0
      ? ((state.totalTime - state.timeLeft) / state.totalTime) * 100
      : 0;

  const isBreakPhase =
    state.phase === "short_break" || state.phase === "long_break";

  return (
    <div className="space-y-3">
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {phaseLabel(state.phase)}
        </p>

        {/* Circular progress with time */}
        <div className="relative mx-auto mt-2 flex h-28 w-28 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className={
                isBreakPhase ? "text-green-500 transition-all" : "text-primary transition-all"
              }
            />
          </svg>
          <span className="text-2xl font-mono font-bold tabular-nums">
            {state.phase === "idle"
              ? formatTime(pomodoro.config.workMinutes * 60)
              : formatTime(state.timeLeft)}
          </span>
        </div>

        {state.cycleCount > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Cykl {state.cycleCount} / {pomodoro.config.cyclesBeforeLongBreak}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        {state.phase === "idle" ? (
          <Button size="sm" onClick={handleStartWork} className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        ) : (
          <>
            {state.isRunning ? (
              <Button size="sm" variant="outline" onClick={handlePause} className="gap-1.5">
                <Pause className="h-3.5 w-3.5" />
                Pauza
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={handleResume} className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  Wznów
                </Button>
                {state.phase === "work" && state.timeLeft === 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleStartBreak}
                    className="gap-1.5"
                  >
                    <Coffee className="h-3.5 w-3.5" />
                    Przerwa
                  </Button>
                )}
              </>
            )}
            <Button size="sm" variant="ghost" onClick={skip} title="Pomiń fazę">
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} title="Reset">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
