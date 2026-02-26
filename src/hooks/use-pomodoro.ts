"use client";

/**
 * usePomodoro
 *
 * Manages Pomodoro timer with work/break phases, configurable durations,
 * and auto-cycling. Uses timestamp-based timing for accuracy across
 * tab switches and Page Visibility API wake-ups.
 */

import { useReducer, useEffect, useRef, useCallback } from "react";

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export type PomodoroPhase = "idle" | "work" | "short_break" | "long_break";

export interface PomodoroState {
  phase: PomodoroPhase;
  isRunning: boolean;
  /** Remaining time in seconds */
  timeLeft: number;
  /** Total duration of current phase in seconds */
  totalTime: number;
  /** Number of completed work cycles in current session */
  cycleCount: number;
  /** Timestamp when current countdown will end (null if paused/idle) */
  endTime: number | null;
  /** Current session ID in Supabase (null if not tracking) */
  sessionId: string | null;
}

type PomodoroAction =
  | { type: "START_WORK"; totalSeconds: number }
  | { type: "START_BREAK"; breakType: "short_break" | "long_break"; totalSeconds: number }
  | { type: "PAUSE" }
  | { type: "RESUME"; endTime: number }
  | { type: "TICK"; timeLeft: number }
  | { type: "PHASE_COMPLETE" }
  | { type: "RESET" }
  | { type: "SET_SESSION_ID"; sessionId: string | null };

const initialState: PomodoroState = {
  phase: "idle",
  isRunning: false,
  timeLeft: 0,
  totalTime: 0,
  cycleCount: 0,
  endTime: null,
  sessionId: null,
};

function reducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case "START_WORK":
      return {
        ...state,
        phase: "work",
        isRunning: true,
        timeLeft: action.totalSeconds,
        totalTime: action.totalSeconds,
        endTime: Date.now() + action.totalSeconds * 1000,
      };
    case "START_BREAK":
      return {
        ...state,
        phase: action.breakType,
        isRunning: true,
        timeLeft: action.totalSeconds,
        totalTime: action.totalSeconds,
        endTime: Date.now() + action.totalSeconds * 1000,
        cycleCount: state.cycleCount + 1,
      };
    case "PAUSE":
      return { ...state, isRunning: false, endTime: null };
    case "RESUME":
      return { ...state, isRunning: true, endTime: action.endTime };
    case "TICK":
      return { ...state, timeLeft: action.timeLeft };
    case "PHASE_COMPLETE":
      return { ...state, isRunning: false, timeLeft: 0, endTime: null };
    case "RESET":
      return initialState;
    case "SET_SESSION_ID":
      return { ...state, sessionId: action.sessionId };
    default:
      return state;
  }
}

export interface UsePomodoroOptions {
  config?: PomodoroConfig;
  onPhaseComplete?: (phase: PomodoroPhase, cycleCount: number) => void;
}

export function usePomodoro(options: UsePomodoroOptions = {}) {
  const { config = DEFAULT_CONFIG, onPhaseComplete } = options;
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPhaseCompleteRef = useRef(onPhaseComplete);

  useEffect(() => {
    onPhaseCompleteRef.current = onPhaseComplete;
  }, [onPhaseComplete]);

  // Cleanup interval
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Read phase/cycleCount via ref inside interval to avoid
  // tearing down the interval on break start (which changes cycleCount)
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  // Tick: compute remaining time from endTime for accuracy
  useEffect(() => {
    if (!state.isRunning || !state.endTime) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((state.endTime! - Date.now()) / 1000)
      );

      if (remaining <= 0) {
        clearTimer();
        const completedPhase = stateRef.current.phase;
        const cycleCount = stateRef.current.cycleCount;
        dispatch({ type: "PHASE_COMPLETE" });
        onPhaseCompleteRef.current?.(completedPhase, cycleCount);
      } else {
        dispatch({ type: "TICK", timeLeft: remaining });
      }
    }, 250); // 250ms for responsiveness without waste

    return clearTimer;
  }, [state.isRunning, state.endTime, clearTimer]);

  // Actions
  const startWork = useCallback(() => {
    dispatch({ type: "START_WORK", totalSeconds: config.workMinutes * 60 });
  }, [config.workMinutes]);

  const startBreak = useCallback(() => {
    const isLongBreak =
      (state.cycleCount + 1) % config.cyclesBeforeLongBreak === 0;
    const breakType = isLongBreak ? "long_break" : "short_break";
    const minutes = isLongBreak
      ? config.longBreakMinutes
      : config.shortBreakMinutes;
    dispatch({ type: "START_BREAK", breakType, totalSeconds: minutes * 60 });
  }, [
    state.cycleCount,
    config.cyclesBeforeLongBreak,
    config.longBreakMinutes,
    config.shortBreakMinutes,
  ]);

  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);

  const resume = useCallback(() => {
    dispatch({
      type: "RESUME",
      endTime: Date.now() + state.timeLeft * 1000,
    });
  }, [state.timeLeft]);

  const reset = useCallback(() => {
    clearTimer();
    dispatch({ type: "RESET" });
  }, [clearTimer]);

  const skip = useCallback(() => {
    clearTimer();
    const completedPhase = state.phase;
    const cycleCount = state.cycleCount;
    dispatch({ type: "PHASE_COMPLETE" });
    onPhaseCompleteRef.current?.(completedPhase, cycleCount);
  }, [clearTimer, state.phase, state.cycleCount]);

  const setSessionId = useCallback((id: string | null) => {
    dispatch({ type: "SET_SESSION_ID", sessionId: id });
  }, []);

  return {
    state,
    startWork,
    startBreak,
    pause,
    resume,
    reset,
    skip,
    setSessionId,
    config,
  };
}
