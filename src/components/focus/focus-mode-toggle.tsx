"use client";

/**
 * FocusModeToggle
 *
 * Button to toggle zen/focus mode that hides sidebar
 * and minimizes header for distraction-free learning.
 */

import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFocusContext } from "./focus-context";

export function FocusModeToggle() {
  const { focusMode } = useFocusContext();

  return (
    <Button
      size="sm"
      variant={focusMode.isFocusMode ? "default" : "outline"}
      onClick={focusMode.toggle}
      className="w-full gap-1.5 text-xs"
    >
      {focusMode.isFocusMode ? (
        <>
          <Minimize2 className="h-3.5 w-3.5" />
          Wyłącz tryb skupienia
        </>
      ) : (
        <>
          <Maximize2 className="h-3.5 w-3.5" />
          Tryb skupienia
        </>
      )}
    </Button>
  );
}
