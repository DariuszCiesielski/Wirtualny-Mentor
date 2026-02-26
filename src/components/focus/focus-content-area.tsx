"use client";

/**
 * FocusContentArea
 *
 * Client wrapper for the main content area that responds to
 * focus mode by removing sidebar offset padding.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFocusContextSafe } from "./focus-context";

export function FocusContentArea({ children }: { children: ReactNode }) {
  const focus = useFocusContextSafe();
  const isFocusMode = focus?.focusMode.isFocusMode ?? false;

  return (
    <div
      className={cn(
        "transition-[padding] duration-300",
        isFocusMode ? "lg:pl-0" : "lg:pl-60"
      )}
    >
      {children}
    </div>
  );
}
