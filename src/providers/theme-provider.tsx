"use client";

/**
 * Theme Provider
 *
 * Wraps the application with next-themes provider.
 * Supports 6 themes: light, dark, glass, minimal, gradient, corporate.
 * CSS variables for each theme are defined in globals.css.
 */

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { THEME_IDS } from "@/lib/themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider themes={THEME_IDS} {...props}>
      {children}
    </NextThemesProvider>
  );
}
