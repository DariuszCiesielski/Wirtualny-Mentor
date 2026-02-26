/**
 * Data Access Layer - Quizzes
 *
 * CRUD operations for quizzes and quiz attempts.
 * Implements lazy generation pattern - quizzes created on first access.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  Quiz,
  QuizAttempt,
  QuizQuestion,
  QuizRow,
  QuizAttemptRow,
  QuizResults,
  QuestionResult,
  RemediationContent,
} from "@/types/quiz";
import { awardPoints, checkAchievements } from "@/lib/gamification/gamification-dal";

// ============================================================================
// ROW TO APPLICATION TYPE CONVERTERS
// ============================================================================

/**
 * Transform quiz row to frontend type (snake_case -> camelCase)
 */
function quizRowToQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    levelId: row.level_id,
    quizType: row.quiz_type,
    questions: row.questions,
    questionCount: row.question_count,
    estimatedMinutes: row.estimated_minutes,
    passThreshold: row.pass_threshold,
    generatedAt: row.generated_at,
    generationModel: row.generation_model,
    version: row.version,
    createdAt: row.created_at,
  };
}

/**
 * Transform attempt row to frontend type
 */
function attemptRowToAttempt(row: QuizAttemptRow): QuizAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    quizId: row.quiz_id,
    answers: row.answers,
    score: row.score,
    correctCount: row.correct_count,
    totalCount: row.total_count,
    passed: row.passed,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    timeSpentSeconds: row.time_spent_seconds,
    remediationViewed: row.remediation_viewed,
    remediationContent: row.remediation_content,
    createdAt: row.created_at,
  };
}

// ============================================================================
// QUIZ CRUD
// ============================================================================

/**
 * Save generated quiz to database
 */
export async function saveQuiz(input: {
  chapterId?: string;
  levelId?: string;
  quizType: "section" | "level_test";
  questions: QuizQuestion[];
  questionCount: number;
  estimatedMinutes: number;
  generationModel: string;
}): Promise<Quiz> {
  const supabase = await createClient();

  // Get current max version for this chapter/level
  const versionQuery = supabase
    .from("quizzes")
    .select("version")
    .order("version", { ascending: false })
    .limit(1);

  if (input.chapterId) {
    versionQuery.eq("chapter_id", input.chapterId);
  } else if (input.levelId) {
    versionQuery.eq("level_id", input.levelId);
    versionQuery.eq("quiz_type", "level_test");
  }

  const { data: existing } = await versionQuery.single();
  const nextVersion = existing ? existing.version + 1 : 1;

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      chapter_id: input.chapterId || null,
      level_id: input.levelId || null,
      quiz_type: input.quizType,
      questions: input.questions,
      question_count: input.questionCount,
      estimated_minutes: input.estimatedMinutes,
      generation_model: input.generationModel,
      version: nextVersion,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save quiz: ${error.message}`);
  }

  return quizRowToQuiz(data as QuizRow);
}

/**
 * Get quiz by ID
 */
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get quiz: ${error.message}`);
  }

  return quizRowToQuiz(data as QuizRow);
}

/**
 * Get latest quiz for a chapter
 */
export async function getQuizByChapter(
  chapterId: string
): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get quiz by chapter: ${error.message}`);
  }

  return quizRowToQuiz(data as QuizRow);
}

/**
 * Get latest level test for a level
 */
export async function getLevelTest(levelId: string): Promise<Quiz | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("level_id", levelId)
    .eq("quiz_type", "level_test")
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to get level test: ${error.message}`);
  }

  return quizRowToQuiz(data as QuizRow);
}

// ============================================================================
// ATTEMPT CRUD
// ============================================================================

/**
 * Create a new quiz attempt (start quiz)
 */
export async function createAttempt(
  userId: string,
  quizId: string
): Promise<QuizAttempt> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      quiz_id: quizId,
      answers: {},
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create attempt: ${error.message}`);
  }

  return attemptRowToAttempt(data as QuizAttemptRow);
}

/**
 * Submit answers and calculate score
 */
export async function submitAttempt(
  attemptId: string,
  answers: Record<string, string>,
  quiz: Quiz
): Promise<{
  attempt: QuizAttempt;
  results: QuizResults;
}> {
  const supabase = await createClient();

  // Calculate score
  const questionResults: QuestionResult[] = [];
  let correctCount = 0;

  for (const question of quiz.questions) {
    const selectedOptionId = answers[question.id] || "";
    const isCorrect = selectedOptionId === question.correctOptionId;

    if (isCorrect) {
      correctCount++;
    }

    questionResults.push({
      questionId: question.id,
      selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect,
      explanation: question.explanation,
    });
  }

  const totalCount = quiz.questions.length;
  const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  const passed = score >= quiz.passThreshold * 100;

  // Get attempt to calculate time spent
  const { data: existingAttempt } = await supabase
    .from("quiz_attempts")
    .select("started_at")
    .eq("id", attemptId)
    .single();

  const startedAt = existingAttempt?.started_at
    ? new Date(existingAttempt.started_at)
    : new Date();
  const submittedAt = new Date();
  const timeSpentSeconds = Math.floor(
    (submittedAt.getTime() - startedAt.getTime()) / 1000
  );

  // Update attempt with results
  const { data, error } = await supabase
    .from("quiz_attempts")
    .update({
      answers,
      score,
      correct_count: correctCount,
      total_count: totalCount,
      passed,
      submitted_at: submittedAt.toISOString(),
      time_spent_seconds: timeSpentSeconds,
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit attempt: ${error.message}`);
  }

  const results: QuizResults = {
    score,
    correctCount,
    totalCount,
    passed,
    questionResults,
    timeSpentSeconds,
  };

  // Gamification: award points for passed/perfect quizzes (fire-and-forget)
  if (passed) {
    awardPoints("quiz_passed", attemptId).catch(() => {});
    if (score === 100) {
      awardPoints("quiz_perfect", attemptId).catch(() => {});
    }
    checkAchievements("quiz").catch(() => {});
  }

  return {
    attempt: attemptRowToAttempt(data as QuizAttemptRow),
    results,
  };
}

/**
 * Get attempt history for a user and quiz
 */
export async function getAttemptHistory(
  userId: string,
  quizId: string
): Promise<QuizAttempt[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get attempt history: ${error.message}`);
  }

  return (data || []).map((row) => attemptRowToAttempt(row as QuizAttemptRow));
}

/**
 * Check if user has passed a level test
 */
export async function hasPassedLevelTest(
  userId: string,
  levelId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Find the level test quiz
  const quiz = await getLevelTest(levelId);
  if (!quiz) {
    return false;
  }

  // Check for passing attempt
  const { count, error } = await supabase
    .from("quiz_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("quiz_id", quiz.id)
    .eq("passed", true);

  if (error) {
    throw new Error(`Failed to check level test status: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

// ============================================================================
// REMEDIATION
// ============================================================================

/**
 * Save remediation content to attempt
 */
export async function saveRemediation(
  attemptId: string,
  remediationContent: RemediationContent
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quiz_attempts")
    .update({
      remediation_content: remediationContent,
      remediation_viewed: false,
    })
    .eq("id", attemptId);

  if (error) {
    throw new Error(`Failed to save remediation: ${error.message}`);
  }
}

/**
 * Mark remediation as viewed
 */
export async function markRemediationViewed(attemptId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("quiz_attempts")
    .update({
      remediation_viewed: true,
    })
    .eq("id", attemptId);

  if (error) {
    throw new Error(`Failed to mark remediation viewed: ${error.message}`);
  }
}

// ============================================================================
// LEVEL UNLOCKS
// ============================================================================

/**
 * Unlock a level for a user
 */
export async function unlockLevel(
  userId: string,
  levelId: string,
  unlockType: "test_passed" | "manual_skip",
  passingAttemptId?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("level_unlocks").upsert(
    {
      user_id: userId,
      level_id: levelId,
      unlock_type: unlockType,
      passing_attempt_id: passingAttemptId || null,
      unlocked_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,level_id",
    }
  );

  if (error) {
    throw new Error(`Failed to unlock level: ${error.message}`);
  }
}

/**
 * Check if a level is unlocked for a user
 */
export async function isLevelUnlocked(
  userId: string,
  levelId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("level_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("level_id", levelId);

  if (error) {
    throw new Error(`Failed to check level unlock status: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
