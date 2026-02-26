"use client";

/**
 * useFocusMode
 *
 * Toggles "focus mode" that hides sidebar and minimizes header
 * for distraction-free learning. Persists in localStorage.
 */

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "wm-focus-mode";

function getStoredFocusMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useFocusMode() {
  // Read initial value from localStorage using useSyncExternalStore to avoid
  // setState-in-effect lint warning while still being SSR-safe
  const storedValue = useSyncExternalStore(
    // subscribe — localStorage doesn't fire events on same-tab changes,
    // so this is effectively a no-op (state managed by React)
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    getStoredFocusMode,
    () => false // server snapshot
  );

  const [isFocusMode, setIsFocusMode] = useState(storedValue);

  // Sync CSS class on <html> and localStorage
  useEffect(() => {
    const html = document.documentElement;
    if (isFocusMode) {
      html.classList.add("focus-mode");
    } else {
      html.classList.remove("focus-mode");
    }
    localStorage.setItem(STORAGE_KEY, String(isFocusMode));
  }, [isFocusMode]);

  const toggle = useCallback(() => setIsFocusMode((v) => !v), []);
  const enter = useCallback(() => setIsFocusMode(true), []);
  const exit = useCallback(() => setIsFocusMode(false), []);

  return { isFocusMode, toggle, enter, exit };
}
