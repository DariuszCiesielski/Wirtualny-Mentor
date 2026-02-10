// Provider Registry for Multi-Model AI
// Source: https://ai-sdk.dev/docs/ai-sdk-core/provider-management

import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import {
  HELICONE_GATEWAYS,
  isHeliconeEnabled,
  createHeliconeHeaders,
} from '@/lib/monitoring/helicone';

// Create providers with optional Helicone integration
const heliconeEnabled = isHeliconeEnabled();
const heliconeHeaders = createHeliconeHeaders();

// Anthropic provider (Claude)
const anthropicProvider = createAnthropic({
  ...(heliconeEnabled && {
    baseURL: HELICONE_GATEWAYS.anthropic,
    headers: heliconeHeaders,
  }),
});

// OpenAI provider (GPT, embeddings)
const openaiProvider = createOpenAI({
  ...(heliconeEnabled && {
    baseURL: HELICONE_GATEWAYS.openai,
    headers: heliconeHeaders,
  }),
});

// Google provider (Gemini)
const googleProvider = createGoogleGenerativeAI({
  ...(heliconeEnabled && {
    baseURL: HELICONE_GATEWAYS.google,
    headers: heliconeHeaders,
  }),
});

// Model routing configuration - rozne modele do roznych zadan
// Koszty optymalizowane: drogi model tylko tam gdzie potrzeba jakosci
export const MODEL_CONFIG = {
  // GPT-5.2 - mentoring with vision (images/documents support)
  mentor: openaiProvider('gpt-5.2'),

  // GPT-5.2 - structured curriculum generation, reliable JSON
  curriculum: openaiProvider('gpt-5.2'),

  // Quiz generation - OpenAI (fast, cheap)
  quiz: openaiProvider('gpt-4o-mini'),

  // Embeddings for RAG (Phase 5)
  embedding: openaiProvider('text-embedding-3-small'),
} as const;

// Provider registry with all configured providers
export const registry = createProviderRegistry({
  anthropic: anthropicProvider,
  openai: openaiProvider,
  google: googleProvider,
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

// Log Helicone status on init (dev only)
if (process.env.NODE_ENV === 'development') {
  console.log(
    heliconeEnabled
      ? '[AI] Helicone monitoring enabled'
      : '[AI] Helicone monitoring disabled (no HELICONE_API_KEY)'
  );
}
