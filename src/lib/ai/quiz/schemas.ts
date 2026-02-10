/**
 * Zod Schemas for Quiz Generation
 *
 * Validation schemas for AI-generated quizzes and assessments.
 * Used for structured output parsing from LLM responses.
 *
 * IMPORTANT: Schemas must be compatible with OpenAI/Google structured outputs.
 * Avoid: z.discriminatedUnion (oneOf), z.record (additionalProperties), z.union.
 */

import { z } from "zod";

// ============================================================================
// OPTION SCHEMAS
// ============================================================================

/**
 * Answer option schema
 */
export const optionSchema = z.object({
  id: z.string().describe("Identyfikator opcji: a, b, c, d"),
  text: z.string().describe("Tresc opcji po polsku"),
});

// ============================================================================
// WRONG EXPLANATION SCHEMA
// ============================================================================

/**
 * Explanation for a wrong answer option
 */
export const wrongExplanationSchema = z.object({
  optionId: z.string().describe("ID opcji (a, b, c lub d)"),
  explanation: z.string().describe("Wyjasnienie dlaczego ta opcja jest bledna"),
});

// ============================================================================
// QUESTION SCHEMA (unified - no discriminatedUnion)
// ============================================================================

/**
 * Unified question schema supporting both multiple_choice and true_false.
 * Uses z.enum instead of z.discriminatedUnion for provider compatibility.
 */
export const questionSchema = z.object({
  id: z.string().describe("Unikalny identyfikator pytania, np. 'q-1'"),
  type: z
    .enum(["multiple_choice", "true_false"])
    .describe("Typ pytania: multiple_choice (4 opcje) lub true_false (2 opcje)"),
  question: z.string().describe("Tresc pytania po polsku"),
  options: z
    .array(optionSchema)
    .describe("Opcje odpowiedzi: 4 dla multiple_choice, 2 dla true_false"),
  correctOptionId: z.string().describe("ID poprawnej opcji (a, b, c lub d)"),
  explanation: z
    .string()
    .describe("Wyjasnienie dlaczego poprawna odpowiedz jest poprawna"),
  wrongExplanations: z
    .array(wrongExplanationSchema)
    .describe("Lista wyjasnien dla kazdej blednej opcji"),
  bloomLevel: z
    .enum(["remembering", "understanding", "applying", "analyzing"])
    .describe("Poziom taksonomii Blooma"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .describe("Poziom trudnosci pytania"),
  relatedConcept: z
    .string()
    .describe("Powiazane pojecie z materialu (pusty string jesli brak)"),
});

// ============================================================================
// QUIZ SCHEMAS
// ============================================================================

/**
 * Section quiz schema (5-7 questions after chapter)
 */
export const quizSchema = z.object({
  questions: z
    .array(questionSchema)
    .describe("Lista pytan quizu (3-10 pytan)"),
  estimatedMinutes: z
    .number()
    .int()
    .describe("Szacowany czas rozwiazywania w minutach"),
  focusAreas: z
    .array(z.string())
    .describe("Glowne tematy pokryte przez quiz"),
});

/**
 * Level test schema (15-20 questions for level advancement)
 */
export const levelTestSchema = z.object({
  questions: z
    .array(questionSchema)
    .describe("Lista pytan testu (10-20 pytan)"),
  estimatedMinutes: z
    .number()
    .int()
    .describe("Szacowany czas rozwiazywania w minutach"),
  levelSummary: z
    .string()
    .describe("Podsumowanie umiejetnosci weryfikowanych testem"),
  masteryIndicators: z
    .array(z.string())
    .describe("Wskazniki opanowania materialu"),
});

// ============================================================================
// REMEDIATION SCHEMAS
// ============================================================================

/**
 * Weak concept identified from quiz results
 */
export const weakConceptSchema = z.object({
  concept: z.string().describe("Nazwa pojecia do powtorzenia"),
  explanation: z.string().describe("Uproszczone wyjasnienie pojecia"),
  example: z.string().describe("Praktyczny przyklad uzycia"),
});

/**
 * Remediation content for failed quiz attempts
 */
export const remediationSchema = z.object({
  weakConcepts: z
    .array(weakConceptSchema)
    .describe("Lista pojec wymagajacych powtorzenia"),
  practiceHints: z
    .array(z.string())
    .describe("Wskazowki do cwiczen praktycznych"),
  suggestedReview: z
    .array(z.string())
    .describe("Sugerowane sekcje do powtorzenia"),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type OptionSchema = z.infer<typeof optionSchema>;
export type WrongExplanationSchema = z.infer<typeof wrongExplanationSchema>;
export type QuestionSchema = z.infer<typeof questionSchema>;
export type QuizSchema = z.infer<typeof quizSchema>;
export type LevelTestSchema = z.infer<typeof levelTestSchema>;
export type WeakConceptSchema = z.infer<typeof weakConceptSchema>;
export type RemediationSchema = z.infer<typeof remediationSchema>;
