/**
 * Curriculum Generation API Endpoint
 *
 * Generates personalized curriculum using AI with web search integration.
 * Uses Tavily for current information and official education standards.
 * Returns streaming structured output.
 */

import { streamObject } from "ai";
import { getModel } from "@/lib/ai/providers";
import {
  curriculumSchema,
  type UserInfo,
} from "@/lib/ai/curriculum/schemas";
import {
  CURRICULUM_SYSTEM_PROMPT,
  OFFICIAL_CURRICULA_SEARCH_PROMPT,
} from "@/lib/ai/curriculum/prompts";
import { searchWeb, extractUrls } from "@/lib/tavily/client";
import { z } from "zod";

const requestSchema = z.object({
  userInfo: z.object({
    topic: z.string(),
    goals: z.array(z.string()),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    weeklyHours: z.number(),
    sourceUrl: z.string().url().optional(),
  }),
  courseId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userInfo, courseId } = requestSchema.parse(body);

    // 1. Web search for current information (optional - skip if no TAVILY_API_KEY)
    let searchResults = "";
    if (process.env.TAVILY_API_KEY) {
      try {
        // Search for general topic info
        const topicSearch = await searchWeb(userInfo.topic, {
          maxResults: 3,
          searchDepth: "basic",
        });

        // Search for official curricula/standards
        const standardsSearchQuery = OFFICIAL_CURRICULA_SEARCH_PROMPT.replace(
          "{topic}",
          userInfo.topic
        );
        const standardsSearch = await searchWeb(standardsSearchQuery, {
          maxResults: 2,
          searchDepth: "basic",
        });

        searchResults = `
## Aktualne informacje o temacie:
${topicSearch.answer || ""}
${topicSearch.results.map((r) => `- ${r.title}: ${r.content.slice(0, 200)}`).join("\n")}

## Oficjalne standardy i programy nauczania:
${standardsSearch.answer || ""}
${standardsSearch.results.map((r) => `- ${r.title}: ${r.content.slice(0, 200)}`).join("\n")}
        `;
      } catch (e) {
        console.warn("Web search failed, continuing without:", e);
      }
    }

    // 2. If user provided sourceUrl, try to extract content
    let sourceContent = "";
    if (userInfo.sourceUrl && process.env.TAVILY_API_KEY) {
      try {
        const extracted = await extractUrls([userInfo.sourceUrl]);
        if (extracted[0]?.content) {
          sourceContent = `\n## Tresc ze zrodla uzytkownika:\n${extracted[0].content.slice(0, 3000)}`;
        }
      } catch (e) {
        console.warn("URL extraction failed:", e);
      }
    }

    // 3. Generate curriculum with streaming
    const result = streamObject({
      model: getModel("curriculum"),
      schema: curriculumSchema,
      system: CURRICULUM_SYSTEM_PROMPT,
      prompt: `Stworz spersonalizowany program nauczania.

## Informacje o uzytkowniku:
- Temat: ${userInfo.topic}
- Cele: ${userInfo.goals.join(", ")}
- Doswiadczenie: ${userInfo.experience === "beginner" ? "Poczatkujacy" : userInfo.experience === "intermediate" ? "Srednio zaawansowany" : "Zaawansowany"}
- Dostepny czas: ${userInfo.weeklyHours} godzin tygodniowo

${searchResults}
${sourceContent}

Wygeneruj curriculum z DOKLADNIE 5 poziomami. Kazdy poziom musi miec unikalne ID (uzyj formatu "level-1", "level-2" itd.), 3-7 learning outcomes i 3-10 rozdzialow.`,
    });

    // Return stream compatible with experimental_useObject
    return result.toTextStreamResponse({
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    console.error("Curriculum generation error:", error);
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
