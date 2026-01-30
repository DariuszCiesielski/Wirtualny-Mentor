// Provider Registry for Multi-Model AI
// Source: https://ai-sdk.dev/docs/ai-sdk-core/provider-management

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';

// Model routing configuration - rozne modele do roznych zadan
// Koszty optymalizowane: drogi model tylko tam gdzie potrzeba jakosci
export const MODEL_CONFIG = {
  // Claude Sonnet 4 - mentoring, long context, empathy, Polish language
  mentor: anthropic('claude-sonnet-4-20250514'),

  // GPT-4.1 - structured curriculum generation, reliable JSON
  curriculum: openai('gpt-4.1'),

  // Gemini 2.0 Flash - fast, cheap quizzes
  quiz: google('gemini-2.0-flash'),

  // Embeddings for RAG (Phase 5)
  embedding: openai('text-embedding-3-small'),
} as const;

// Provider registry with all configured providers
export const registry = createProviderRegistry({
  anthropic,
  openai,
  google,
});

// Helper to get model for specific task
export function getModel(task: keyof typeof MODEL_CONFIG) {
  return MODEL_CONFIG[task];
}

// Get model name string for logging
export function getModelName(task: keyof typeof MODEL_CONFIG): string {
  const model = MODEL_CONFIG[task];
  // Access modelId from the model object
  return (model as { modelId?: string }).modelId || task;
}
