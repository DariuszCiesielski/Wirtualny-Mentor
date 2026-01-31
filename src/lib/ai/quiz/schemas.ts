/**
 * Zod Schemas for Quiz Generation
 *
 * Validation schemas for AI-generated quizzes and assessments.
 * Used for structured output parsing from LLM responses.
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
// QUESTION SCHEMAS
// ============================================================================

/**
 * Multiple choice question schema
 */
export const multipleChoiceSchema = z.object({
  id: z.string().describe("Unikalny identyfikator pytania, np. 'q-1'"),
  type: z.literal("multiple_choice"),
  question: z.string().describe("Tresc pytania po polsku"),
  options: z
    .array(optionSchema)
    .length(4)
    .describe("Dokladnie 4 opcje odpowiedzi"),
  correctOptionId: z.string().describe("ID poprawnej opcji (a, b, c lub d)"),
  explanation: z
    .string()
    .describe("Wyjasnienie dlaczego poprawna odpowiedz jest poprawna"),
  wrongExplanations: z
    .record(z.string(), z.string())
    .describe("Mapa optionId -> wyjasnienie dlaczego ta opcja jest bledna"),
  bloomLevel: z
    .enum(["remembering", "understanding", "applying", "analyzing"])
    .describe("Poziom taksonomii Blooma"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .describe("Poziom trudnosci pytania"),
  relatedConcept: z
    .string()
    .optional()
    .describe("Powiazane pojecie z materialu"),
});

/**
 * True/False question schema
 */
export const trueFalseSchema = z.object({
  id: z.string().describe("Unikalny identyfikator pytania, np. 'q-1'"),
  type: z.literal("true_false"),
  question: z.string().describe("Stwierdzenie do oceny prawda/falsz po polsku"),
  options: z
    .array(optionSchema)
    .length(2)
    .describe("Dokladnie 2 opcje: Prawda i Falsz"),
  correctOptionId: z.string().describe("ID poprawnej opcji (a lub b)"),
  explanation: z.string().describe("Wyjasnienie poprawnej odpowiedzi"),
  wrongExplanations: z
    .record(z.string(), z.string())
    .describe("Wyjasnienie dlaczego druga opcja jest bledna"),
  bloomLevel: z
    .enum(["remembering", "understanding"])
    .describe("Poziom taksonomii Blooma (tylko remembering/understanding)"),
  difficulty: z
    .enum(["easy", "medium"])
    .describe("Poziom trudnosci (tylko easy/medium)"),
  relatedConcept: z
    .string()
    .optional()
    .describe("Powiazane pojecie z materialu"),
});

/**
 * Union of all question types
 */
export const questionSchema = z.discriminatedUnion("type", [
  multipleChoiceSchema,
  trueFalseSchema,
]);

// ============================================================================
// QUIZ SCHEMAS
// ============================================================================

/**
 * Section quiz schema (5-7 questions after chapter)
 */
export const quizSchema = z.object({
  questions: z
    .array(questionSchema)
    .min(3)
    .max(10)
    .describe("Lista pytan quizu (3-10 pytan)"),
  estimatedMinutes: z
    .number()
    .int()
    .positive()
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
    .min(10)
    .max(20)
    .describe("Lista pytan testu (10-20 pytan)"),
  estimatedMinutes: z
    .number()
    .int()
    .positive()
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
export type MultipleChoiceSchema = z.infer<typeof multipleChoiceSchema>;
export type TrueFalseSchema = z.infer<typeof trueFalseSchema>;
export type QuestionSchema = z.infer<typeof questionSchema>;
export type QuizSchema = z.infer<typeof quizSchema>;
export type LevelTestSchema = z.infer<typeof levelTestSchema>;
export type WeakConceptSchema = z.infer<typeof weakConceptSchema>;
export type RemediationSchema = z.infer<typeof remediationSchema>;
