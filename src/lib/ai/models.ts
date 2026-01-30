// Model-specific configurations and constraints

export const MODEL_CONSTRAINTS = {
  mentor: {
    maxTokens: 4096,
    temperature: 0.7,  // More creative for engaging conversation
    systemPrompt: `Jestes Wirtualnym Mentorem - przyjaznym nauczycielem AI.
Uzywasz metody sokratycznej: naprowadzasz na odpowiedz zamiast dawac gotowe rozwiazania.
Mowisz po polsku, jasno i przystepnie.
Wspierasz i motywujesz ucznia.`,
  },
  curriculum: {
    maxTokens: 8192,
    temperature: 0.3,  // More deterministic for structured output
  },
  quiz: {
    maxTokens: 2048,
    temperature: 0.5,
  },
} as const;

// Cost estimates per 1M tokens (for budgeting)
// Source: Provider pricing pages, January 2025
export const COST_PER_MILLION = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
} as const;
