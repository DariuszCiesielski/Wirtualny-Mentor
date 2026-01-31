/**
 * Types for Learning Materials (Section Content)
 *
 * Defines structures for AI-generated educational content with citations.
 * Keep in sync with supabase/migrations/20260131000001_section_content.sql
 */

// ============================================================================
// CONTENT STRUCTURES
// ============================================================================

/**
 * Source - reference for anti-hallucination tracking
 */
export interface Source {
  id: string;
  title: string;
  url: string;
  type: "documentation" | "article" | "video" | "course" | "official";
  accessedAt: string;
  snippet?: string;
}

/**
 * KeyConcept - important term with definition
 */
export interface KeyConcept {
  term: string;
  definition: string;
  example?: string;
}

/**
 * PracticalStep - step-by-step instruction
 */
export interface PracticalStep {
  stepNumber: number;
  title: string;
  instruction: string;
  command?: string;
  expectedOutput?: string;
  explanation?: string;
}

/**
 * Tool - software tool recommendation
 */
export interface Tool {
  name: string;
  url: string;
  description: string;
  installCommand?: string;
  isFree: boolean;
}

/**
 * ExternalResource - additional learning resource link
 */
export interface ExternalResource {
  title: string;
  url: string;
  type: "docs" | "tutorial" | "video" | "article" | "course";
  language: "pl" | "en";
  description: string;
}

// ============================================================================
// MAIN ENTITY
// ============================================================================

/**
 * SectionContent - main content entity (camelCase for frontend)
 */
export interface SectionContent {
  id: string;
  chapterId: string;
  content: string;
  keyConcepts: KeyConcept[];
  practicalSteps: PracticalStep[];
  tools: Tool[];
  externalResources: ExternalResource[];
  sources: Source[];
  wordCount: number;
  estimatedReadingMinutes: number;
  language: "pl" | "en";
  generatedAt: string;
  generationModel?: string;
  generationCostTokens?: number;
  version: number;
}

// ============================================================================
// DATABASE ROW TYPE
// ============================================================================

/**
 * SectionContentRow - database row type (snake_case)
 */
export interface SectionContentRow {
  id: string;
  chapter_id: string;
  content: string;
  key_concepts: KeyConcept[];
  practical_steps: PracticalStep[];
  tools: Tool[];
  external_resources: ExternalResource[];
  sources: Source[];
  word_count: number | null;
  estimated_reading_minutes: number | null;
  language: string;
  generated_at: string;
  generation_model: string | null;
  generation_cost_tokens: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Partial content for streaming/partial updates
 */
export interface PartialSectionContent {
  content?: string;
  keyConcepts?: KeyConcept[];
  practicalSteps?: PracticalStep[];
  tools?: Tool[];
  externalResources?: ExternalResource[];
  sources?: Source[];
  wordCount?: number;
  estimatedReadingMinutes?: number;
}

/**
 * Content generation input
 */
export interface GenerateContentInput {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  topics: string[];
  levelName: string;
  courseTitle: string;
  language: "pl" | "en";
}
