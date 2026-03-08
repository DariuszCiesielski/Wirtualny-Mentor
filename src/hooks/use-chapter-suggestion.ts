"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { BusinessSuggestion } from "@/types/business-ideas";
import {
  bookmarkSuggestion,
  dismissSuggestion,
} from "@/lib/business-ideas/ideas-dal";

interface GenerateParams {
  courseId: string;
  content: string;
  chapterTitle: string;
  courseTopic?: string;
  force?: boolean;
}

/**
 * Hook managing the full lifecycle of a business suggestion per chapter.
 * Handles: generate, bookmark (optimistic), dismiss (optimistic), refresh.
 */
export function useChapterSuggestion(
  chapterId: string,
  initialSuggestion?: BusinessSuggestion | null
) {
  const [suggestion, setSuggestion] = useState<BusinessSuggestion | null>(
    initialSuggestion ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: GenerateParams) => {
      // Double-click guard
      if (isGenerating) return;

      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch("/api/business-ideas/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId, ...params }),
        });

        if (response.status === 429) {
          setRemaining(0);
          toast.error("Dzisiejszy limit został wykorzystany");
          return;
        }

        if (!response.ok) {
          const msg = "Nie udało się wygenerować sugestii";
          setError(msg);
          toast.error(msg);
          return;
        }

        const data = await response.json();
        setSuggestion(data.suggestion);
        setRemaining(data.remaining);
      } catch {
        const msg = "Nie udało się wygenerować sugestii";
        setError(msg);
        toast.error(msg);
      } finally {
        setIsGenerating(false);
      }
    },
    [chapterId, isGenerating]
  );

  const bookmark = useCallback(async () => {
    if (!suggestion) return;

    const previous = suggestion;
    const newBookmarked = !suggestion.is_bookmarked;

    // Optimistic update
    setSuggestion({ ...suggestion, is_bookmarked: newBookmarked });

    try {
      const result = await bookmarkSuggestion(suggestion.id);
      if (!result.success) {
        // Rollback
        setSuggestion(previous);
        toast.error("Nie udało się zmienić zakładki");
        return;
      }
      toast.success(
        newBookmarked ? "Pomysł zapisany" : "Pomysł usunięty z zapisanych"
      );
    } catch {
      // Rollback
      setSuggestion(previous);
      toast.error("Nie udało się zmienić zakładki");
    }
  }, [suggestion]);

  const dismiss = useCallback(async () => {
    if (!suggestion) return;

    const previous = suggestion;

    // Optimistic update
    setSuggestion(null);

    try {
      const result = await dismissSuggestion(suggestion.id);
      if (!result.success) {
        // Rollback
        setSuggestion(previous);
        toast.error("Nie udało się ukryć pomysłu");
        return;
      }
      toast.success("Pomysł ukryty");
    } catch {
      // Rollback
      setSuggestion(previous);
      toast.error("Nie udało się ukryć pomysłu");
    }
  }, [suggestion]);

  const refresh = useCallback(
    (params: Omit<GenerateParams, "force">) => {
      return generate({ ...params, force: true });
    },
    [generate]
  );

  return {
    suggestion,
    isGenerating,
    remaining,
    error,
    generate,
    bookmark,
    dismiss,
    refresh,
  };
}
