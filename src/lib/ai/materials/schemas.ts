/**
 * Zod Schemas for Learning Materials
 *
 * Validation schemas for AI-generated educational content.
 * Used for structured output parsing from LLM responses.
 *
 * Note: OpenAI Structured Output requires all properties to be required
 * (no .optional()) and doesn't support 'uri' or 'date-time' formats.
 * Use empty strings for optional fields instead.
 */

import { z } from "zod";

// ============================================================================
// COMPONENT SCHEMAS
// ============================================================================

/**
 * Source schema for anti-hallucination tracking
 * Note: url uses z.string() instead of z.string().url() for OpenAI compatibility
 * Note: accessedAt uses z.string() instead of z.string().datetime() for OpenAI compatibility
 */
export const sourceSchema = z.object({
  id: z.string().describe("Unikalny identyfikator zrodla, np. 'src-1'"),
  title: z.string().describe("Tytul zrodla"),
  url: z.string().describe("URL do zrodla"),
  type: z
    .enum(["documentation", "article", "video", "course", "official"])
    .describe("Typ zrodla"),
  accessedAt: z.string().describe("Data dostepu w formacie ISO"),
  snippet: z.string().describe("Krotki fragment z zrodla (pusty string jesli brak)"),
});

/**
 * Key concept schema
 * Note: example is required, use empty string if not applicable
 */
export const keyConceptSchema = z.object({
  term: z.string().describe("Termin lub pojecie"),
  definition: z.string().describe("Definicja pojecia"),
  example: z.string().describe("Przyklad uzycia (pusty string jesli brak)"),
});

/**
 * Practical step schema
 * Note: optional fields use empty strings instead
 */
export const practicalStepSchema = z.object({
  stepNumber: z.number().int().positive().describe("Numer kroku"),
  title: z.string().describe("Krotki tytul kroku"),
  instruction: z.string().describe("Szczegolowa instrukcja"),
  command: z.string().describe("Komenda do wykonania (pusty string jesli nie dotyczy)"),
  expectedOutput: z.string().describe("Oczekiwany wynik (pusty string jesli brak)"),
  explanation: z.string().describe("Wyjasnienie dlaczego ten krok (pusty string jesli brak)"),
});

/**
 * Tool schema
 * Note: url uses z.string() instead of z.string().url() for OpenAI compatibility
 */
export const toolSchema = z.object({
  name: z.string().describe("Nazwa narzedzia"),
  url: z.string().describe("URL do strony narzedzia"),
  description: z.string().describe("Krotki opis do czego sluzy"),
  installCommand: z.string().describe("Komenda instalacji (pusty string jesli brak)"),
  isFree: z.boolean().describe("Czy narzedzie jest darmowe"),
});

/**
 * External resource schema
 * Note: url uses z.string() instead of z.string().url() for OpenAI compatibility
 */
export const externalResourceSchema = z.object({
  title: z.string().describe("Tytul zasobu"),
  url: z.string().describe("URL do zasobu"),
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
 * Note: Arrays don't use .default([]) for OpenAI compatibility
 */
export const sectionContentSchema = z.object({
  content: z
    .string()
    .describe(
      "Tresc w formacie markdown z inline citations [1], [2]. Uzyj formatowania: naglowki ##, listy, bloki kodu ```"
    ),
  keyConcepts: z
    .array(keyConceptSchema)
    .describe("Kluczowe pojecia omawiane w sekcji (pusta tablica jesli brak)"),
  practicalSteps: z
    .array(practicalStepSchema)
    .describe("Kroki praktyczne do wykonania (pusta tablica jesli brak)"),
  tools: z
    .array(toolSchema)
    .describe("Polecane narzedzia (pusta tablica jesli brak)"),
  externalResources: z
    .array(externalResourceSchema)
    .describe("Dodatkowe materialy do nauki (pusta tablica jesli brak)"),
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
