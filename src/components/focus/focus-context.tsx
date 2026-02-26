"use client";

/**
 * FocusContext
 *
 * Provides focus panel state (Pomodoro, sounds, focus mode, stats)
 * to the entire dashboard. Coordinates auto-play sounds with Pomodoro phases.
 */

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  usePomodoro,
  type PomodoroConfig,
  type PomodoroPhase,
  DEFAULT_CONFIG,
} from "@/hooks/use-pomodoro";
import { useFocusSounds } from "@/hooks/use-focus-sounds";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useFocusStats } from "@/hooks/use-focus-stats";
import { useCustomSounds } from "@/hooks/use-custom-sounds";
import {
  createFocusSession,
  completeFocusSession,
  cancelFocusSession,
} from "@/lib/focus/focus-dal";
import { BINAURAL_PRESETS } from "@/lib/focus/audio-presets";
import { toast } from "sonner";

interface FocusContextValue {
  pomodoro: ReturnType<typeof usePomodoro>;
  sounds: ReturnType<typeof useFocusSounds>;
  focusMode: ReturnType<typeof useFocusMode>;
  focusStats: ReturnType<typeof useFocusStats>;
  customSounds: ReturnType<typeof useCustomSounds>;
  handleStartWork: () => void;
  handleStartBreak: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleReset: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function useFocusContext() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error("useFocusContext must be used within FocusProvider");
  }
  return ctx;
}

/** Safe version that returns null outside provider (for sidebar/header) */
export function useFocusContextSafe() {
  return useContext(FocusContext);
}

interface FocusProviderProps {
  children: ReactNode;
  config?: PomodoroConfig;
}

export function FocusProvider({
  children,
  config = DEFAULT_CONFIG,
}: FocusProviderProps) {
  const focusStats = useFocusStats();
  const customSoundsHook = useCustomSounds();
  const sounds = useFocusSounds(customSoundsHook.getCustomUrl);
  const focusMode = useFocusMode();

  // Ref breaks circular dependency: handlePhaseComplete needs sessionId
  // from pomodoro, but pomodoro receives handlePhaseComplete as callback
  const sessionIdRef = useRef<string | null>(null);
  const setSessionIdRef = useRef<(id: string | null) => void>(() => {});
  const soundsRef = useRef(sounds);

  useEffect(() => { soundsRef.current = sounds; }, [sounds]);

  const handlePhaseComplete = useCallback(
    async (phase: PomodoroPhase) => {
      if (phase === "work") {
        toast("Sesja zakończona! Czas na przerwę.", {
          description: "Dobra robota! Rozciągnij się, napij wody.",
        });
        const sid = sessionIdRef.current;
        if (sid) {
          completeFocusSession(sid).catch(() => {});
          setSessionIdRef.current(null);
        }
        focusStats.incrementPomodoro(config.workMinutes);
        if (soundsRef.current.activeBinaural) {
          const alpha = BINAURAL_PRESETS.find((p) => p.id === "alpha");
          if (alpha) soundsRef.current.startBinaural(alpha);
        }
      } else if (phase === "short_break" || phase === "long_break") {
        toast("Przerwa skończona! Wracamy do nauki.", {
          description: "Gotowy na kolejną sesję?",
        });
        const sid = sessionIdRef.current;
        if (sid) {
          completeFocusSession(sid).catch(() => {});
          setSessionIdRef.current(null);
        }
        if (soundsRef.current.activeBinaural) {
          const gamma = BINAURAL_PRESETS.find((p) => p.id === "gamma");
          if (gamma) soundsRef.current.startBinaural(gamma);
        }
      }
    },
    [config.workMinutes, focusStats]
  );

  const pomodoro = usePomodoro({
    config,
    onPhaseComplete: handlePhaseComplete,
  });

  // Keep refs in sync
  useEffect(() => {
    sessionIdRef.current = pomodoro.state.sessionId;
    setSessionIdRef.current = pomodoro.setSessionId;
  }, [pomodoro.state.sessionId, pomodoro.setSessionId]);

  // Orchestrated actions
  const handleStartWork = useCallback(async () => {
    pomodoro.startWork();
    try {
      const sessionId = await createFocusSession({
        sessionType: "pomodoro_work",
        configWorkMin: config.workMinutes,
        configBreakMin: config.shortBreakMinutes,
      });
      pomodoro.setSessionId(sessionId);
    } catch {
      // Non-critical — timer works even without persistence
    }
  }, [pomodoro, config.workMinutes, config.shortBreakMinutes]);

  const handleStartBreak = useCallback(async () => {
    pomodoro.startBreak();
    try {
      const sessionId = await createFocusSession({
        sessionType: "pomodoro_break",
        configWorkMin: config.workMinutes,
        configBreakMin: config.shortBreakMinutes,
      });
      pomodoro.setSessionId(sessionId);
    } catch {
      // Non-critical
    }
  }, [pomodoro, config.workMinutes, config.shortBreakMinutes]);

  const handlePause = useCallback(() => {
    pomodoro.pause();
  }, [pomodoro]);

  const handleResume = useCallback(() => {
    pomodoro.resume();
  }, [pomodoro]);

  const handleReset = useCallback(async () => {
    const sessionId = pomodoro.state.sessionId;
    if (sessionId) {
      cancelFocusSession(sessionId).catch(() => {});
    }
    pomodoro.reset();
    sounds.stopAll();
  }, [pomodoro, sounds]);

  return (
    <FocusContext.Provider
      value={{
        pomodoro,
        sounds,
        focusMode,
        focusStats,
        customSounds: customSoundsHook,
        handleStartWork,
        handleStartBreak,
        handlePause,
        handleResume,
        handleReset,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}
