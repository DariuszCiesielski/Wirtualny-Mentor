"use client";

/**
 * BreakReminder
 *
 * Sonner toaster integration for focus panel break notifications.
 * Must be rendered once in the layout (alongside Toaster).
 */

import { Toaster } from "@/components/ui/sonner";

export function FocusToaster() {
  return <Toaster position="top-center" richColors closeButton />;
}
