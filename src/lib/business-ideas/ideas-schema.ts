/**
 * Zod schemas for Business Suggestions AI output and request validation
 */

import { z } from "zod/v4";
import type { BusinessProfile } from "@/types/onboarding";

// Schema for AI generateObject output — single suggestion
export const suggestionOutputSchema = z.object({
  suggestions: z
    .array(
      z.object({
        title: z
          .string()
          .describe("Zwiezly tytul pomyslu biznesowego (max 100 znakow)"),
        description: z
          .string()
          .describe(
            "Opis pomyslu: co, dla kogo, jak zaczac (2-4 zdania po polsku)"
          ),
        business_potential: z
          .string()
          .describe(
            "Potencjal biznesowy: dlaczego warto, szacowany rynek (1-2 zdania)"
          ),
        estimated_complexity: z
          .enum(["prosty", "sredni", "zlozony"])
          .describe(
            "prosty = mozna zaczac solo w weekend, sredni = wymaga planu i budzetu, zlozony = wymaga zespolu i inwestycji"
          ),
        relevant_section: z
          .string()
          .describe(
            "Naglowek sekcji (h2) z tresci lekcji, ktora zainspirowal ten pomysl"
          ),
        reasoning: z
          .string()
          .describe("Dlaczego ta sekcja inspiruje ten pomysl biznesowy"),
      })
    )
    .min(0)
    .max(1),
});

// Schema for POST request body validation
export const generateRequestSchema = z.object({
  chapterId: z.string().uuid(),
  courseId: z.string().uuid(),
  content: z.string().min(1),
  chapterTitle: z.string().min(1),
  courseTopic: z.string().optional(),
  force: z.boolean().optional(),
});

/**
 * Compute a deterministic hash for cache invalidation.
 * Changes when chapter content, profile, or prompt version changes.
 */
export async function computeInputHash(
  chapterId: string,
  content: string,
  profile: BusinessProfile | null,
  promptVersion: string
): Promise<string> {
  const profileKey = profile
    ? `${profile.industry}|${profile.role}|${profile.business_goal}|${profile.company_size ?? ""}`
    : "no-profile";

  const input = `${chapterId}|${content.slice(0, 2000)}|${profileKey}|${promptVersion}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hashHex.slice(0, 16);
}
