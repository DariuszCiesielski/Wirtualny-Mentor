import { z } from 'zod';

// Schema dla zebranych informacji o uzytkowniku
export const userInfoSchema = z.object({
  topic: z.string().describe('Temat nauki'),
  goals: z.array(z.string()).describe('Cele uzytkownika'),
  experience: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('Poziom doswiadczenia'),
  weeklyHours: z.number().positive().describe('Godziny nauki tygodniowo'),
  sourceUrl: z.string().url().optional().describe('Opcjonalny link zrodlowy'),
});
export type UserInfo = z.infer<typeof userInfoSchema>;

// Schema dla odpowiedzi AI w fazie clarifying questions
export const clarificationSchema = z.object({
  question: z.string().describe('Pytanie do uzytkownika'),
  options: z.array(z.string()).optional().describe('Sugerowane odpowiedzi'),
  isComplete: z.boolean().describe('Czy zebrano wystarczajaco informacji'),
  collectedInfo: userInfoSchema
    .partial()
    .optional()
    .describe('Dotychczas zebrane informacje'),
});
export type ClarificationResponse = z.infer<typeof clarificationSchema>;

// Schema dla learning outcome
export const learningOutcomeSchema = z.object({
  id: z.string(),
  description: z.string().describe('Co uzytkownik bedzie umial po ukonczeniu'),
});
export type LearningOutcome = z.infer<typeof learningOutcomeSchema>;

// Schema dla rozdzialu
export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  estimatedMinutes: z.number().int().positive(),
  topics: z.array(z.string()),
});
export type Chapter = z.infer<typeof chapterSchema>;

// Schema dla poziomu (5 poziomow w curriculum)
export const levelSchema = z.object({
  id: z.string(),
  name: z.enum([
    'Poczatkujacy',
    'Srednio zaawansowany',
    'Zaawansowany',
    'Master',
    'Guru',
  ]),
  description: z.string(),
  learningOutcomes: z.array(learningOutcomeSchema).min(3).max(7),
  chapters: z.array(chapterSchema).min(3).max(10),
  estimatedHours: z.number().positive(),
});
export type Level = z.infer<typeof levelSchema>;

// Schema dla resource
export const resourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(['article', 'video', 'documentation', 'course', 'book']),
});
export type Resource = z.infer<typeof resourceSchema>;

// Schema dla pelnego curriculum
export const curriculumSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  totalEstimatedHours: z.number().positive(),
  levels: z.array(levelSchema).length(5), // Dokladnie 5 poziomow
  prerequisites: z.array(z.string()),
  resources: z.array(resourceSchema).optional(),
});
export type Curriculum = z.infer<typeof curriculumSchema>;

// Schema dla standardow edukacyjnych (oficjalne curricula)
export const educationalStandardSchema = z.object({
  source: z
    .string()
    .describe('Zrodlo standardu (np. MEN, uniwersytet, certyfikacja)'),
  competencies: z.array(z.string()).describe('Wymagane kompetencje'),
  alignment: z.string().describe('Jak kurs realizuje te standardy'),
});
export type EducationalStandard = z.infer<typeof educationalStandardSchema>;
