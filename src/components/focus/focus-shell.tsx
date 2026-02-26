"use client";

/**
 * FocusShell
 *
 * Client component wrapper that provides FocusProvider
 * and FocusToaster to the dashboard layout.
 */

import type { ReactNode } from "react";
import { FocusProvider } from "./focus-context";
import { FocusToaster } from "./break-reminder";

export function FocusShell({ children }: { children: ReactNode }) {
  return (
    <FocusProvider>
      {children}
      <FocusToaster />
    </FocusProvider>
  );
}
