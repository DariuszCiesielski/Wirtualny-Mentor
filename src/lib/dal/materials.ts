/**
 * Data Access Layer - Materials (Section Content)
 *
 * CRUD operations for AI-generated learning materials.
 * Implements lazy generation pattern - content created on first access.
 */

import { createClient } from '@/lib/supabase/server';
import type { SectionContent, SectionContentRow } from '@/types/materials';

/**
 * Transform database row to frontend type (snake_case -> camelCase)
 */
function transformRow(row: SectionContentRow): SectionContent {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    content: row.content,
    keyConcepts: row.key_concepts || [],
    practicalSteps: row.practical_steps || [],
    tools: row.tools || [],
    externalResources: row.external_resources || [],
    sources: row.sources || [],
    wordCount: row.word_count || 0,
    estimatedReadingMinutes: row.estimated_reading_minutes || 0,
    language: row.language as 'pl' | 'en',
    generatedAt: row.generated_at,
    generationModel: row.generation_model || undefined,
    generationCostTokens: row.generation_cost_tokens || undefined,
    version: row.version,
  };
}

/**
 * Get existing section content for a chapter
 *
 * @param chapterId - The chapter ID
 * @returns Latest version of section content or null if not generated
 */
export async function getSectionContent(
  chapterId: string
): Promise<SectionContent | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('section_content')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to get section content: ${error.message}`);
  }

  return transformRow(data as SectionContentRow);
}

/**
 * Save generated section content
 *
 * @param chapterId - The chapter ID
 * @param content - Generated content to save
 * @param generationModel - Model used for generation
 * @param costTokens - Token cost of generation
 * @returns Saved section content
 */
export async function saveSectionContent(
  chapterId: string,
  content: Omit<SectionContent, 'id' | 'chapterId' | 'version' | 'generatedAt'>,
  generationModel?: string,
  costTokens?: number
): Promise<SectionContent> {
  const supabase = await createClient();

  // Get current max version for this chapter
  const { data: existing } = await supabase
    .from('section_content')
    .select('version')
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = existing ? existing.version + 1 : 1;

  const { data, error } = await supabase
    .from('section_content')
    .insert({
      chapter_id: chapterId,
      content: content.content,
      key_concepts: content.keyConcepts,
      practical_steps: content.practicalSteps,
      tools: content.tools,
      external_resources: content.externalResources,
      sources: content.sources,
      word_count: content.wordCount,
      estimated_reading_minutes: content.estimatedReadingMinutes,
      language: content.language || 'pl',
      generation_model: generationModel,
      generation_cost_tokens: costTokens,
      version: nextVersion,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save section content: ${error.message}`);
  }

  return transformRow(data as SectionContentRow);
}

/**
 * Check if content exists for a chapter (without fetching full content)
 *
 * @param chapterId - The chapter ID
 * @returns True if content exists
 */
export async function hasContent(chapterId: string): Promise<boolean> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('section_content')
    .select('id', { count: 'exact', head: true })
    .eq('chapter_id', chapterId);

  if (error) {
    throw new Error(`Failed to check content: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

/**
 * Get all content versions for a chapter
 *
 * @param chapterId - The chapter ID
 * @returns Array of all versions (metadata only)
 */
export async function getContentVersions(
  chapterId: string
): Promise<Array<{ version: number; generatedAt: string; wordCount: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('section_content')
    .select('version, generated_at, word_count')
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false });

  if (error) {
    throw new Error(`Failed to get versions: ${error.message}`);
  }

  return (data || []).map((row) => ({
    version: row.version,
    generatedAt: row.generated_at,
    wordCount: row.word_count || 0,
  }));
}
