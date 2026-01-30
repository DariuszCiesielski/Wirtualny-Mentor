// AI Orchestrator - centralny punkt dla wszystkich wywolan AI
// Zapewnia: model routing, cost tracking, error handling

import { generateText, streamText, generateObject, type LanguageModelUsage, type ModelMessage } from 'ai';
import { z } from 'zod';
import { getModel, getModelName } from '@/lib/ai/providers';
import { MODEL_CONSTRAINTS, COST_PER_MILLION } from '@/lib/ai/models';
import type { AITask, CostLog } from '@/types/ai';

// In-memory cost logs (replace with DB in production - Phase 7)
const costLogs: CostLog[] = [];

/**
 * Log token usage for cost tracking
 */
function logUsage(
  task: AITask,
  modelName: string,
  usage: LanguageModelUsage,
  durationMs?: number
): void {
  const inTokens = usage.inputTokens ?? 0;
  const outTokens = usage.outputTokens ?? 0;

  const log: CostLog = {
    task,
    model: modelName,
    inputTokens: inTokens,
    outputTokens: outTokens,
    timestamp: new Date(),
    durationMs,
  };

  costLogs.push(log);

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    const costs = COST_PER_MILLION[modelName as keyof typeof COST_PER_MILLION];
    const estimatedCost = costs
      ? (inTokens * costs.input + outTokens * costs.output) / 1_000_000
      : 0;

    console.log(
      `[AI COST] ${task} (${modelName}): ` +
      `${inTokens} in, ${outTokens} out ` +
      `(~$${estimatedCost.toFixed(4)})`
    );
  }
}

/**
 * Execute AI task with automatic model routing and cost tracking
 */
export async function executeAITask<T = string>(
  task: AITask,
  params: {
    prompt?: string;
    messages?: ModelMessage[];
    schema?: z.ZodSchema<T>;
    stream?: boolean;
    systemPrompt?: string;
  }
): Promise<T | ReturnType<typeof streamText>> {
  const model = getModel(task);
  const modelName = getModelName(task);
  const constraints = MODEL_CONSTRAINTS[task as keyof typeof MODEL_CONSTRAINTS];
  const startTime = Date.now();

  // Use task-specific system prompt if not overridden
  const systemPrompt = params.systemPrompt ?? (constraints && 'systemPrompt' in constraints ? constraints.systemPrompt : undefined);

  // Build common settings
  const settings = {
    maxOutputTokens: constraints?.maxOutputTokens,
    temperature: constraints?.temperature,
  };

  // Structured output with Zod schema
  if (params.schema) {
    const result = await generateObject({
      model,
      schema: params.schema,
      prompt: params.prompt ?? '',
      system: systemPrompt,
      ...settings,
    });

    logUsage(task, modelName, result.usage, Date.now() - startTime);
    return result.object as T;
  }

  // Streaming response
  if (params.stream) {
    // Use messages if provided, otherwise use prompt
    const promptConfig = params.messages
      ? { messages: params.messages }
      : { prompt: params.prompt ?? '' };

    const result = streamText({
      model,
      ...promptConfig,
      system: systemPrompt,
      ...settings,
      onFinish: ({ usage }) => {
        logUsage(task, modelName, usage, Date.now() - startTime);
      },
    });

    return result as ReturnType<typeof streamText>;
  }

  // Simple text generation
  const promptConfig = params.messages
    ? { messages: params.messages }
    : { prompt: params.prompt ?? '' };

  const result = await generateText({
    model,
    ...promptConfig,
    system: systemPrompt,
    ...settings,
  });

  logUsage(task, modelName, result.usage, Date.now() - startTime);
  return result.text as T;
}

/**
 * Get all cost logs (for monitoring dashboard - Phase 7)
 */
export function getCostLogs(): CostLog[] {
  return [...costLogs];
}

/**
 * Get cost summary by task
 */
export function getCostSummary(): Record<AITask, { calls: number; totalTokens: number }> {
  const summary: Record<string, { calls: number; totalTokens: number }> = {};

  for (const log of costLogs) {
    if (!summary[log.task]) {
      summary[log.task] = { calls: 0, totalTokens: 0 };
    }
    summary[log.task].calls++;
    summary[log.task].totalTokens += log.inputTokens + log.outputTokens;
  }

  return summary as Record<AITask, { calls: number; totalTokens: number }>;
}

/**
 * Clear cost logs (for testing)
 */
export function clearCostLogs(): void {
  costLogs.length = 0;
}
