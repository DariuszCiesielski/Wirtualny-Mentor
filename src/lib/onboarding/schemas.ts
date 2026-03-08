/**
 * Zod validation schemas for Business Onboarding
 */

import { z } from "zod/v4";

/**
 * Schema for business profile form validation
 */
export const businessProfileSchema = z.object({
  industry: z.string().min(1, "Branża jest wymagana"),
  role: z.string().min(1, "Rola jest wymagana"),
  business_goal: z
    .string()
    .min(1, "Cel biznesowy jest wymagany")
    .max(200, "Cel biznesowy może mieć maksymalnie 200 znaków"),
  company_size: z.string().optional(),
});

export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

/**
 * Schema for onboarding chat AI response (structured output)
 */
export const onboardingChatSchema = z.object({
  question: z
    .string()
    .describe(
      "Pytanie doprecyzowujące do użytkownika o jego doświadczenie biznesowe"
    ),
  isComplete: z
    .boolean()
    .describe(
      "Czy zebrano wystarczająco informacji, aby wygenerować podsumowanie doświadczenia"
    ),
  experience_summary: z
    .string()
    .describe(
      "Podsumowanie doświadczenia biznesowego użytkownika (2-3 zdania). Wypełnij tylko gdy isComplete=true"
    ),
});

export type OnboardingChatResponse = z.infer<typeof onboardingChatSchema>;
