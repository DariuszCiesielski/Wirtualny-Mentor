"use client";

/**
 * Clarifying Chat Component
 *
 * Chat interface for AI clarifying questions.
 * Placeholder - will be completed in Task 2.
 */

import type { UserInfo } from "@/lib/ai/curriculum/schemas";

interface ClarifyingChatProps {
  topic: string;
  sourceUrl?: string;
  onComplete: (info: Partial<UserInfo>) => void;
}

export function ClarifyingChat({
  topic,
  sourceUrl,
  onComplete,
}: ClarifyingChatProps) {
  return (
    <div className="text-center py-16">
      <h2 className="text-lg font-medium">Pytania doprecyzowujace</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Temat: {topic}
        {sourceUrl && <span className="block">Zrodlo: {sourceUrl}</span>}
      </p>
      <p className="text-sm text-muted-foreground mt-4">
        Chat z AI - wkrotce
      </p>
    </div>
  );
}
