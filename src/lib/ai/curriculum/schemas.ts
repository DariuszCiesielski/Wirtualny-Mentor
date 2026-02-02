import { z } from 'zod';

// Schema dla zebranych informacji o uzytkowniku
// Note: Using z.string() instead of z.string().url() for sourceUrl
// because OpenAI structured output doesn't support 'uri' format
export const userInfoSchema = z.object({
  topic: z.string().describe('Temat nauki'),
  goals: z.array(z.string()).describe('Cele uzytkownika'),
  experience: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('Poziom doswiadczenia'),
  weeklyHours: z.number().positive().describe('Godziny nauki tygodniowo'),
  sourceUrl: z.string().optional().describe('Opcjonalny link zrodlowy'),
});
export type UserInfo = z.infer<typeof userInfoSchema>;

// Schema dla odpowiedzi AI w fazie clarifying questions
// Note: OpenAI structured output requires all properties to be required,
// so we can't use .partial(). Instead, all fields in collectedInfo have defaults.
export const clarificationSchema = z.object({
  question: z.string().describe('Pytanie do uzytkownika'),
  options: z.array(z.string()).describe('Sugerowane odpowiedzi (pusta tablica jesli brak)'),
  isComplete: z.boolean().describe('Czy zebrano wystarczajaco informacji'),
  collectedInfo: z.object({
    topic: z.string().describe('Temat nauki (pusty string jesli nieznany)'),
    goals: z.array(z.string()).describe('Cele uzytkownika'),
    experience: z.string().describe('Poziom: beginner, intermediate lub advanced (pusty jesli nieznany)'),
    weeklyHours: z.number().describe('Godziny nauki tygodniowo (0 jesli nieznane)'),
    sourceUrl: z.string().describe('Opcjonalny link zrodlowy (pusty jesli brak)'),
  }).describe('Dotychczas zebrane informacje'),
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
// Note: Using z.string() instead of z.string().url() for url
// because OpenAI structured output doesn't support 'uri' format
export const resourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['article', 'video', 'documentation', 'course', 'book']),
});
export type Resource = z.infer<typeof resourceSchema>;

// Schema dla pelnego curriculum
// Note: OpenAI structured output requires all properties to be required,
// so resources is not optional (AI returns empty array if no resources)
export const curriculumSchema = z.object({
  title: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  totalEstimatedHours: z.number().positive(),
  levels: z.array(levelSchema).length(5), // Dokladnie 5 poziomow
  prerequisites: z.array(z.string()),
  resources: z.array(resourceSchema),
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
