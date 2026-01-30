import { z } from "zod";

// ============================================================================
// AI Task Types - dla orchestration warstwy AI
// ============================================================================

/**
 * Status zadania AI
 */
export type AITaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

/**
 * Typ modelu AI - wspierane providery
 */
export type AIModelProvider = "anthropic" | "openai" | "google";

/**
 * Zadanie AI do wykonania przez orchestrator
 */
export interface AITask {
  id: string;
  type: string;
  status: AITaskStatus;
  provider: AIModelProvider;
  model: string;
  prompt: string;
  context?: Record<string, unknown>;
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  tokenUsage?: TokenUsage;
}

/**
 * Zuzycie tokenow
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ============================================================================
// Cost Tracking - dla monitorowania kosztow AI
// ============================================================================

/**
 * Log kosztu pojedynczego zapytania AI
 */
export interface CostLog {
  id: string;
  taskId: string;
  provider: AIModelProvider;
  model: string;
  tokenUsage: TokenUsage;
  estimatedCostUSD: number;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Podsumowanie kosztow
 */
export interface CostSummary {
  totalCostUSD: number;
  totalTokens: number;
  byProvider: Record<AIModelProvider, number>;
  byModel: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Model Configuration - konfiguracja modeli AI
// ============================================================================

/**
 * Konfiguracja pojedynczego modelu
 */
export interface ModelConfig {
  provider: AIModelProvider;
  modelId: string;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
  capabilities: ModelCapability[];
  isDefault?: boolean;
}

/**
 * Mozliwosci modelu
 */
export type ModelCapability =
  | "chat"
  | "streaming"
  | "function-calling"
  | "vision"
  | "code-generation"
  | "long-context";

// ============================================================================
// Curriculum Types - dla generowania programow nauki
// ============================================================================

/**
 * Modul w programie nauki
 */
export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  estimatedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  topics: CurriculumTopic[];
}

/**
 * Temat w module
 */
export interface CurriculumTopic {
  id: string;
  title: string;
  content: string;
  resources: Resource[];
  exercises: Exercise[];
  assessmentCriteria: string[];
}

/**
 * Zasob edukacyjny
 */
export interface Resource {
  id: string;
  type: "article" | "video" | "documentation" | "tutorial" | "book";
  title: string;
  url: string;
  description: string;
  isFree: boolean;
  estimatedMinutes?: number;
}

/**
 * Cwiczenie praktyczne
 */
export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: "coding" | "quiz" | "project" | "reflection";
  difficulty: "easy" | "medium" | "hard";
  hints?: string[];
  solution?: string;
}

/**
 * Pelny program nauki
 */
export interface Curriculum {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  totalEstimatedHours: number;
  modules: CurriculumModule[];
  createdAt: Date;
  updatedAt: Date;
  generatedBy: AIModelProvider;
}

// ============================================================================
// Zod Schemas - dla walidacji runtime
// ============================================================================

export const AITaskStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled"
]);

export const AIModelProviderSchema = z.enum(["anthropic", "openai", "google"]);

export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const AITaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: AITaskStatusSchema,
  provider: AIModelProviderSchema,
  model: z.string(),
  prompt: z.string(),
  context: z.record(z.string(), z.unknown()).optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  tokenUsage: TokenUsageSchema.optional(),
});

export const CostLogSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  provider: AIModelProviderSchema,
  model: z.string(),
  tokenUsage: TokenUsageSchema,
  estimatedCostUSD: z.number().nonnegative(),
  timestamp: z.date(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

export const ModelCapabilitySchema = z.enum([
  "chat",
  "streaming",
  "function-calling",
  "vision",
  "code-generation",
  "long-context",
]);

export const ModelConfigSchema = z.object({
  provider: AIModelProviderSchema,
  modelId: z.string(),
  displayName: z.string(),
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  costPer1kInputTokens: z.number().nonnegative(),
  costPer1kOutputTokens: z.number().nonnegative(),
  capabilities: z.array(ModelCapabilitySchema),
  isDefault: z.boolean().optional(),
});

export const ResourceSchema = z.object({
  id: z.string(),
  type: z.enum(["article", "video", "documentation", "tutorial", "book"]),
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  isFree: z.boolean(),
  estimatedMinutes: z.number().int().positive().optional(),
});

export const ExerciseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["coding", "quiz", "project", "reflection"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  hints: z.array(z.string()).optional(),
  solution: z.string().optional(),
});

export const CurriculumTopicSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  resources: z.array(ResourceSchema),
  exercises: z.array(ExerciseSchema),
  assessmentCriteria: z.array(z.string()),
});

export const CurriculumModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  objectives: z.array(z.string()),
  estimatedHours: z.number().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  prerequisites: z.array(z.string()),
  topics: z.array(CurriculumTopicSchema),
});

export const CurriculumSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  totalEstimatedHours: z.number().positive(),
  modules: z.array(CurriculumModuleSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  generatedBy: AIModelProviderSchema,
});

// ============================================================================
// Type Exports from Schemas (for inference)
// ============================================================================

export type AITaskInput = z.input<typeof AITaskSchema>;
export type CostLogInput = z.input<typeof CostLogSchema>;
export type ModelConfigInput = z.input<typeof ModelConfigSchema>;
export type CurriculumInput = z.input<typeof CurriculumSchema>;
