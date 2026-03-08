/**
 * Types for Business Suggestions module (Phase 9)
 */

export interface BusinessSuggestion {
  id: string;
  user_id: string;
  course_id: string;
  chapter_id: string;
  title: string;
  description: string;
  business_potential: string;
  estimated_complexity: "prosty" | "sredni" | "zlozony";
  relevant_section: string | null;
  model_name: string;
  input_hash: string;
  profile_version: number;
  is_bookmarked: boolean;
  is_dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export interface GenerateSuggestionRequest {
  chapterId: string;
  courseId: string;
  content: string;
  chapterTitle: string;
  courseTopic?: string;
  force?: boolean;
}

export interface GenerateSuggestionResponse {
  suggestion: BusinessSuggestion | null;
  remaining: number;
}

export interface DailyLimitResult {
  remaining: number;
  allowed: boolean;
}

export interface BookmarkedSuggestionWithContext {
  id: string;
  title: string;
  description: string;
  business_potential: string;
  estimated_complexity: "prosty" | "sredni" | "zlozony";
  relevant_section: string | null;
  course_id: string;
  chapter_id: string;
  created_at: string;
  course_title: string;
  chapter_title: string;
  level_id: string;
}

export interface ContactInfo {
  email: string | null;
  phone: string | null;
  formUrl: string | null;
}
