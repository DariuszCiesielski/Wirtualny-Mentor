/**
 * Zod Schemas for Learning Materials
 *
 * Validation schemas for AI-generated educational content.
 * Used for structured output parsing from LLM responses.
 */

import { z } from "zod";

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Source schema for anti-hallucination tracking
 */
export const sourceSchema = z.object({
  id: z.string().describe("Unikalny identyfikator zrodla, np. 'src-1'"),
  title: z.string().describe("Tytul zrodla"),
  url: z.string().url().describe("URL do zrodla"),
  type: z
    .enum(["documentation", "article", "video", "course", "official"])
    .describe("Typ zrodla"),
  accessedAt: z.string().datetime().describe("Data dostepu w formacie ISO"),
  snippet: z.string().optional().describe("Krotki fragment z zrodla"),
});

/**
 * Key concept schema
 */
export const keyConceptSchema = z.object({
  term: z.string().describe("Termin lub pojecie"),
  definition: z.string().describe("Definicja pojecia"),
  example: z.string().optional().describe("Przyklad uzycia"),
});

/**
 * Practical step schema
 */
export const practicalStepSchema = z.object({
  stepNumber: z.number().int().positive().describe("Numer kroku"),
  title: z.string().describe("Krotki tytul kroku"),
  instruction: z.string().describe("Szczegolowa instrukcja"),
  command: z.string().optional().describe("Komenda do wykonania (jesli dotyczy)"),
  expectedOutput: z.string().optional().describe("Oczekiwany wynik"),
  explanation: z.string().optional().describe("Wyjasnienie dlaczego ten krok"),
});

/**
 * Tool schema
 */
export const toolSchema = z.object({
  name: z.string().describe("Nazwa narzedzia"),
  url: z.string().url().describe("URL do strony narzedzia"),
  description: z.string().describe("Krotki opis do czego sluzy"),
  installCommand: z.string().optional().describe("Komenda instalacji"),
  isFree: z.boolean().describe("Czy narzedzie jest darmowe"),
});

/**
 * External resource schema
 */
export const externalResourceSchema = z.object({
  title: z.string().describe("Tytul zasobu"),
  url: z.string().url().describe("URL do zasobu"),
  type: z
    .enum(["docs", "tutorial", "video", "article", "course"])
    .describe("Typ zasobu"),
  language: z.enum(["pl", "en"]).describe("Jezyk zasobu"),
  description: z.string().describe("Krotki opis zasobu"),
});

// ============================================================================
// MAIN CONTENT SCHEMA
// ============================================================================

/**
 * Full section content schema for AI generation
 */
export const sectionContentSchema = z.object({
  content: z
    .string()
    .describe(
      "Tresc w formacie markdown z inline citations [1], [2]. Uzyj formatowania: naglowki ##, listy, bloki kodu ```"
    ),
  keyConcepts: z
    .array(keyConceptSchema)
    .default([])
    .describe("Kluczowe pojecia omawiane w sekcji"),
  practicalSteps: z
    .array(practicalStepSchema)
    .default([])
    .describe("Kroki praktyczne do wykonania"),
  tools: z
    .array(toolSchema)
    .default([])
    .describe("Polecane narzedzia"),
  externalResources: z
    .array(externalResourceSchema)
    .default([])
    .describe("Dodatkowe materialy do nauki"),
  sources: z
    .array(sourceSchema)
    .describe("Zrodla uzyte w tresci - WYMAGANE dla kazdej cytacji"),
  wordCount: z.number().int().positive().describe("Liczba slow w content"),
  estimatedReadingMinutes: z
    .number()
    .int()
    .positive()
    .describe("Szacowany czas czytania w minutach"),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type SectionContentGenerated = z.infer<typeof sectionContentSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type KeyConcept = z.infer<typeof keyConceptSchema>;
export type PracticalStep = z.infer<typeof practicalStepSchema>;
export type Tool = z.infer<typeof toolSchema>;
export type ExternalResource = z.infer<typeof externalResourceSchema>;
