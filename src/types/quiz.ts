/**
 * Types for Quiz and Assessment System
 *
 * Defines structures for quizzes, quiz attempts, and level unlocks.
 * Keep in sync with supabase/migrations/20260131100001_quizzes_schema.sql
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Quiz types - section quiz or level test
 */
export type QuizType = "section" | "level_test";

/**
 * Level unlock types
 */
export type UnlockType = "test_passed" | "manual_skip";

/**
 * Question types
 */
export type QuestionType = "multiple_choice" | "true_false";

/**
 * Bloom's taxonomy levels for question classification
 */
export type BloomLevel =
  | "remembering"
  | "understanding"
  | "applying"
  | "analyzing";

/**
 * Question difficulty levels
 */
export type Difficulty = "easy" | "medium" | "hard";

// ============================================================================
// QUESTION STRUCTURES (stored in JSONB)
// ============================================================================

/**
 * Answer option for a question
 */
export interface QuestionOption {
  id: string; // 'a', 'b', 'c', 'd' or 'a', 'b' for true/false
  text: string;
}

/**
 * Explanation for a wrong answer option
 */
export interface WrongExplanation {
  optionId: string;
  explanation: string;
}

/**
 * Quiz question - stored in quizzes.questions JSONB
 */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string; // Question text or statement for true_false
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  wrongExplanations: WrongExplanation[]; // array of { optionId, explanation }
  bloomLevel: BloomLevel;
  difficulty: Difficulty;
  relatedConcept?: string;
}

// ============================================================================
// DATABASE ROW TYPES (snake_case)
// ============================================================================

/**
 * Quiz row - database representation
 */
export interface QuizRow {
  id: string;
  chapter_id: string | null;
  level_id: string | null;
  quiz_type: QuizType;
  questions: QuizQuestion[];
  question_count: number;
  estimated_minutes: number | null;
  pass_threshold: number;
  generated_at: string;
  generation_model: string | null;
  version: number;
  created_at: string;
}

/**
 * Quiz attempt row - database representation
 */
export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string>; // questionId -> selectedOptionId
  score: number | null;
  correct_count: number | null;
  total_count: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  remediation_viewed: boolean;
  remediation_content: RemediationContent | null;
  created_at: string;
}

/**
 * Level unlock row - database representation
 */
export interface LevelUnlockRow {
  id: string;
  user_id: string;
  level_id: string;
  unlock_type: UnlockType;
  unlocked_at: string;
  passing_attempt_id: string | null;
}

// ============================================================================
// APPLICATION TYPES (camelCase)
// ============================================================================

/**
 * Quiz - frontend representation
 */
export interface Quiz {
  id: string;
  chapterId: string | null;
  levelId: string | null;
  quizType: QuizType;
  questions: QuizQuestion[];
  questionCount: number;
  estimatedMinutes: number | null;
  passThreshold: number;
  generatedAt: string;
  generationModel: string | null;
  version: number;
  createdAt: string;
}

/**
 * Quiz attempt - frontend representation
 */
export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, string>;
  score: number | null;
  correctCount: number | null;
  totalCount: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
  remediationViewed: boolean;
  remediationContent: RemediationContent | null;
  createdAt: string;
}

/**
 * Level unlock - frontend representation
 */
export interface LevelUnlock {
  id: string;
  userId: string;
  levelId: string;
  unlockType: UnlockType;
  unlockedAt: string;
  passingAttemptId: string | null;
}

// ============================================================================
// REMEDIATION CONTENT
// ============================================================================

/**
 * Weak concept identified from quiz results
 */
export interface WeakConcept {
  concept: string;
  explanation: string;
  example: string;
}

/**
 * Remediation content - AI-generated help for failed quiz
 */
export interface RemediationContent {
  weakConcepts: WeakConcept[];
  practiceHints: string[];
  suggestedReview: string[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a new quiz
 */
export interface CreateQuizInput {
  chapterId?: string;
  levelId?: string;
  quizType: QuizType;
  questions: QuizQuestion[];
  questionCount: number;
  estimatedMinutes?: number;
  passThreshold?: number;
  generationModel?: string;
}

/**
 * Input for submitting quiz answers
 */
export interface SubmitQuizInput {
  answers: Record<string, string>; // questionId -> selectedOptionId
}

/**
 * Input for starting a new quiz attempt
 */
export interface StartAttemptInput {
  quizId: string;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Individual question result
 */
export interface QuestionResult {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string;
}

/**
 * Overall quiz results
 */
export interface QuizResults {
  score: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  questionResults: QuestionResult[];
  timeSpentSeconds: number;
}

// ============================================================================
// GENERATION INPUT TYPES
// ============================================================================

/**
 * Context for generating section quiz
 */
export interface GenerateSectionQuizInput {
  chapterId: string;
  chapterTitle: string;
  chapterDescription: string;
  topics: string[];
  levelName: string;
  courseTitle: string;
  sectionContent?: string; // If already generated
}

/**
 * Context for generating level test
 */
export interface GenerateLevelTestInput {
  levelId: string;
  levelName: string;
  levelDescription: string;
  courseTitle: string;
  chapters: Array<{
    title: string;
    topics: string[];
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Quiz with attempt status for UI display
 */
export interface QuizWithAttemptStatus extends Quiz {
  lastAttempt?: QuizAttempt;
  attemptCount: number;
  bestScore: number | null;
  hasPassed: boolean;
}

/**
 * Level with unlock status for UI display
 */
export interface LevelWithUnlockStatus {
  levelId: string;
  isUnlocked: boolean;
  unlockType: UnlockType | null;
  unlockedAt: string | null;
  requiresTest: boolean;
}
