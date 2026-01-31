/**
 * AI SDK Tools for Material Generation
 *
 * Tools that allow AI to search for current information and extract content
 * from external sources during material generation.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { searchWeb, extractUrls } from '@/lib/tavily/client';

/**
 * Tool for searching educational resources
 *
 * AI uses this to find documentation, tutorials, and articles
 * before generating content.
 */
export const searchResourcesTool = tool({
  description: `Wyszukaj aktualne zasoby edukacyjne, dokumentacje i tutoriale na dany temat.
Uzyj tego narzedzia aby znalezc:
- Oficjalna dokumentacje
- Tutoriale i kursy
- Artykuly z przykladami
- Narzedzia i ich linki

WAZNE: Preferuj anglojezyczne zapytania dla lepszych wynikow.`,
  inputSchema: z.object({
    query: z.string().describe('Zapytanie do wyszukiwarki (preferuj angielskie frazy)'),
    type: z.enum(['documentation', 'tutorial', 'tool', 'article']).optional()
      .describe('Typ szukanego zasobu'),
  }),
  execute: async ({ query, type }: { query: string; type?: 'documentation' | 'tutorial' | 'tool' | 'article' }) => {
    // Enhance query with type hint for better results
    let enhancedQuery = query;
    if (type) {
      const typeHints: Record<string, string> = {
        documentation: 'official docs documentation',
        tutorial: 'tutorial guide how to',
        tool: 'tool download install',
        article: 'article explained',
      };
      enhancedQuery = `${query} ${typeHints[type]}`;
    }

    try {
      const results = await searchWeb(enhancedQuery, {
        searchDepth: 'advanced',
        maxResults: 5,
      });

      return {
        success: true,
        answer: results.answer,
        sources: results.results.map((r, i) => ({
          id: `src-${Date.now()}-${i + 1}`,
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          type: type || 'article',
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
        sources: [],
      };
    }
  },
});

/**
 * Tool for extracting detailed content from a URL
 *
 * AI uses this when it needs more detailed information
 * from a specific documentation page or tutorial.
 */
export const extractContentTool = tool({
  description: `Wyciagnij szczegolowa tresc z podanego URL (np. dokumentacji, tutoriala).
Uzyj gdy potrzebujesz wiecej szczegolow z konkretnej strony znalezionej przez searchResources.`,
  inputSchema: z.object({
    url: z.string().url().describe('URL do wyciagniecia tresci'),
    intent: z.string().describe('Co chcesz znalezc w tej stronie'),
  }),
  execute: async ({ url, intent }: { url: string; intent: string }) => {
    try {
      const extracted = await extractUrls([url]);

      if (!extracted[0]?.content) {
        return {
          success: false,
          error: 'Nie udalo sie wyciagnac tresci',
          url,
        };
      }

      return {
        success: true,
        url,
        content: extracted[0].content.slice(0, 8000), // Limit for context
        extractedFor: intent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed',
        url,
      };
    }
  },
});

/**
 * Combined tools object for material generation
 */
export const materialGenerationTools = {
  searchResources: searchResourcesTool,
  extractContent: extractContentTool,
};

/**
 * Type for collected sources from tool calls
 */
export interface CollectedSource {
  id: string;
  title: string;
  url: string;
  content: string;
  score?: number;
  type?: string;
}
