"use client";

/**
 * Theme Provider
 *
 * Wraps the application with next-themes provider for dark mode support.
 * Uses class-based theme switching with system preference detection.
 *
 * @see https://ui.shadcn.com/docs/dark-mode/next
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
