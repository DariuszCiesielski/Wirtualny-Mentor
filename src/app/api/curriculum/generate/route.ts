/**
 * Curriculum Generation API Endpoint
 *
 * Generates personalized curriculum using AI.
 * Supports two modes:
 * 1. Material-based: RAG retrieval from uploaded documents
 * 2. Web-search: Tavily for current information (original flow)
 *
 * The "useWebSearch" flag controls whether internet data supplements materials.
 * Returns streaming structured output.
 */

import { streamObject } from "ai";
import { getModel } from "@/lib/ai/providers";
import {
  curriculumSchema,
} from "@/lib/ai/curriculum/schemas";
import {
  CURRICULUM_SYSTEM_PROMPT,
  CURRICULUM_FROM_MATERIALS_SYSTEM_PROMPT,
} from "@/lib/ai/curriculum/prompts";
import { searchWeb, extractUrls } from "@/lib/tavily/client";
import { getDocumentsByIds, searchChunksSemantic } from "@/lib/dal/source-documents";
import { z } from "zod";

const requestSchema = z.object({
  userInfo: z.object({
    topic: z.string(),
    goals: z.array(z.string()),
    experience: z.enum(["beginner", "intermediate", "advanced"]),
    weeklyHours: z.number(),
    sourceUrl: z.string().optional(),
  }),
  courseId: z.string().uuid(),
  uploadedDocumentIds: z.array(z.string().uuid()).optional(),
  useWebSearch: z.boolean().optional().default(true),
});

import {
  OFFICIAL_CURRICULA_SEARCH_PROMPT,
} from "@/lib/ai/curriculum/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userInfo, courseId, uploadedDocumentIds, useWebSearch } = requestSchema.parse(body);

    const hasDocuments = uploadedDocumentIds && uploadedDocumentIds.length > 0;

    // ===== MATERIAL CONTEXT (if documents uploaded) =====
    let materialContext = "";
    if (hasDocuments) {
      try {
        // Get document summaries
        const documents = await getDocumentsByIds(uploadedDocumentIds);
        const completedDocs = documents.filter(
          (d) => d.processing_status === "completed" && d.text_summary
        );

        const summaries = completedDocs
          .map((d) => `### ${d.filename}\n${d.text_summary}`)
          .join("\n\n");

        // RAG retrieval - search for most relevant chunks
        const queryText = `${userInfo.topic} ${userInfo.goals.join(" ")}`;
        const relevantChunks = await searchChunksSemantic(courseId, queryText, 0.4, 20);

        const chunksText = relevantChunks
          .map((c) => c.content)
          .join("\n---\n");

        materialContext = `
## MATERIALY ZRODLOWE UZYTKOWNIKA:

### Streszczenia dokumentow:
${summaries}

### Najbardziej relevantne fragmenty (${relevantChunks.length} chunków):
${chunksText || "(brak wynikow wyszukiwania - uzyj streszczeń)"}
`;
      } catch (err) {
        console.warn("[generate] Failed to load material context:", err);
      }
    }

    // ===== WEB SEARCH (only if enabled) =====
    let searchResults = "";
    if (useWebSearch && process.env.TAVILY_API_KEY) {
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

    // ===== SOURCE URL EXTRACTION (if provided and web search enabled) =====
    let sourceContent = "";
    if (userInfo.sourceUrl && useWebSearch && process.env.TAVILY_API_KEY) {
      try {
        const extracted = await extractUrls([userInfo.sourceUrl]);
        if (extracted[0]?.content) {
          sourceContent = `\n## Tresc ze zrodla uzytkownika:\n${extracted[0].content.slice(0, 3000)}`;
        }
      } catch (e) {
        console.warn("URL extraction failed:", e);
      }
    }

    // ===== CHOOSE SYSTEM PROMPT =====
    const systemPrompt = hasDocuments
      ? CURRICULUM_FROM_MATERIALS_SYSTEM_PROMPT
      : CURRICULUM_SYSTEM_PROMPT;

    // ===== GENERATE CURRICULUM =====
    const result = streamObject({
      model: getModel("curriculum"),
      schema: curriculumSchema,
      system: systemPrompt,
      prompt: `Stworz spersonalizowany program nauczania.

## Informacje o uzytkowniku:
- Temat: ${userInfo.topic}
- Cele: ${userInfo.goals.join(", ")}
- Doswiadczenie: ${userInfo.experience === "beginner" ? "Poczatkujacy" : userInfo.experience === "intermediate" ? "Srednio zaawansowany" : "Zaawansowany"}
- Dostepny czas: ${userInfo.weeklyHours} godzin tygodniowo

${materialContext}
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
