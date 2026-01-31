/**
 * AI SDK Tools for Mentor Chatbot
 *
 * Tool definitions for RAG retrieval from user's notes
 * during mentor conversations.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { searchNotesSemantic } from '@/lib/dal/notes';

/**
 * Context required for tool execution
 */
export interface ToolContext {
  userId: string;
  courseId: string;
}

/**
 * Create searchNotes tool with user/course context
 *
 * This factory function returns a tool bound to specific user and course,
 * allowing the AI mentor to search through user's notes during conversation.
 *
 * @param context - User and course identifiers
 * @returns AI SDK tool for semantic note search
 */
export function createSearchNotesTool(context: ToolContext) {
  return tool({
    description: `Wyszukaj w notatkach uzytkownika informacje zwiazane z pytaniem.
Uzyj tego narzedzia gdy:
- Uzytkownik pyta o cos co mogl zapisac w notatkach
- Potrzebujesz kontekstu z wczesniejszej nauki uzytkownika
- Chcesz odwolac sie do tego co uzytkownik juz wie

Przyklad zapytan:
- "co zapisalem o funkcjach" -> query: "funkcje"
- "moje notatki o CSS" -> query: "CSS style"`,
    inputSchema: z.object({
      query: z.string().describe('Fraza do wyszukania semantycznego w notatkach'),
    }),
    execute: async ({ query }) => {
      const results = await searchNotesSemantic(
        context.userId,
        context.courseId,
        query,
        0.5, // Lower threshold for better recall
        5
      );

      if (results.length === 0) {
        return {
          found: false,
          message: 'Uzytkownik nie ma notatek na ten temat.',
        };
      }

      return {
        found: true,
        notes: results.map((r) => ({
          content: r.content.slice(0, 500), // Truncate for context window
          relevance: Math.round(r.similarity * 100),
        })),
      };
    },
  });
}
