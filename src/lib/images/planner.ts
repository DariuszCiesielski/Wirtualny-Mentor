/**
 * AI Image Planner
 *
 * Analyzes lesson content and decides which sections to illustrate.
 * Uses GPT-4o-mini for cost efficiency (~$0.002 per plan).
 *
 * Outputs 1-2 image plans with:
 * - section heading to illustrate
 * - type: stock_photo vs ai_generated
 * - search query or generation prompt
 * - alt text for accessibility
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { getModel } from '@/lib/ai/providers'
import type { ImagePlan } from '@/types/images'

const imagePlanSchema = z.object({
  images: z.array(
    z.object({
      sectionHeading: z.string().describe('Copy the heading EXACTLY as it appears in the list below, including any numbering like "2. " prefix. Do NOT modify, simplify, or remove prefixes.'),
      imageType: z.enum(['stock_photo', 'ai_generated']).describe(
        'stock_photo for real-world subjects (plants, animals, places, food, people, objects). ' +
        'ai_generated for abstract concepts, diagrams, infographics, processes, comparisons.'
      ),
      query: z.string().describe(
        'For stock_photo: English search query for Unsplash (e.g. "chamomile plant close-up botanical"). ' +
        'For ai_generated: detailed English prompt for image generation (e.g. "educational infographic showing...").'
      ),
      altText: z.string().describe('Polish accessibility description of what the image shows'),
      reasoning: z.string().describe('Why this section benefits from an illustration'),
    })
  ).min(1).max(2),
})

const PLANNER_SYSTEM_PROMPT = `Jestes asystentem do planowania ilustracji w lekcjach edukacyjnych.

Twoje zadanie: przeanalizuj tresc lekcji i wybierz 1-2 sekcje (h2), ktore najbardziej skorzystaja z ilustracji.

Zasady:
- Wybieraj sekcje, gdzie obraz ZNACZACO poprawi zrozumienie (nie dekoracyjnie)
- stock_photo: tematy przyrodnicze, medyczne, kulinarne, geograficzne — prawdziwe zdjecia sa lepsze
- ai_generated: abstrakcyjne koncepcje, procesy, porownania, diagramy, infografiki
- query/prompt MUSI byc po angielsku (Unsplash i AI generatory dzialaja lepiej po angielsku)
- altText MUSI byc po polsku (dla uzytkownikow platformy)
- NIE ilustruj sekcji "Wprowadzenie", "Podsumowanie", "Zrodla" — to nie potrzebuje grafik
- Jesli lekcja jest czysto teoretyczna/abstrakcyjna — moze potrzebowac max 1 grafiki
- Jesli lekcja dotyczy czegoś wizualnego (rosliny, gotowanie, geografia) — 2 grafiki

KRYTYCZNE: sectionHeading MUSI byc DOKLADNA kopia naglowka z listy "Dostepne sekcje (h2)".
Kopiuj heading DOKLADNIE jak jest, lacznie z numerami (np. "2. KLUCZOWE POJECIA").
NIE usuwaj numerow, prefiksow, znakow specjalnych ani formatowania.
Jesli heading to "3. SZCZEGOLOWE WYJASNIENIE", uzyj dokladnie "3. SZCZEGOLOWE WYJASNIENIE".`

/**
 * Plan which sections of a lesson should have images
 *
 * @param content - Markdown content of the lesson
 * @param chapterTitle - Title of the chapter
 * @param courseTopic - Topic of the course (for context)
 * @returns 1-2 image plans
 */
export async function planLessonImages(
  content: string,
  chapterTitle: string,
  courseTopic?: string,
): Promise<ImagePlan[]> {
  // Extract h2 headings from markdown
  const headings = content.match(/^## .+$/gm)?.map(h => h.replace('## ', '')) || []

  if (headings.length === 0) {
    console.warn('[ImagePlanner] No h2 headings found in content')
    return []
  }

  // Truncate content for cost efficiency (keep first 4000 chars)
  const truncatedContent = content.length > 4000
    ? content.slice(0, 4000) + '\n...[tresc skrocona]...'
    : content

  const result = await generateObject({
    model: getModel('quiz'), // GPT-4o-mini — cheap and fast
    schema: imagePlanSchema,
    system: PLANNER_SYSTEM_PROMPT,
    prompt: `Tytul rozdzialu: "${chapterTitle}"
${courseTopic ? `Temat kursu: "${courseTopic}"` : ''}

Dostepne sekcje (h2):
${headings.map(h => `- ${h}`).join('\n')}

Tresc lekcji:
${truncatedContent}`,
  })

  console.log(
    `[ImagePlanner] Planned ${result.object.images.length} images for "${chapterTitle}":`,
    result.object.images.map(i => `${i.sectionHeading} (${i.imageType})`).join(', ')
  )

  return result.object.images
}

/**
 * Plan a single image for a specific section (on-demand)
 */
export async function planSectionImage(
  sectionHeading: string,
  sectionContent: string,
  chapterTitle: string,
  courseTopic?: string,
): Promise<ImagePlan> {
  const result = await generateObject({
    model: getModel('quiz'),
    schema: imagePlanSchema,
    system: PLANNER_SYSTEM_PROMPT,
    prompt: `Tytul rozdzialu: "${chapterTitle}"
${courseTopic ? `Temat kursu: "${courseTopic}"` : ''}

Zaplanuj 1 ilustracje dla sekcji: "${sectionHeading}"

Tresc sekcji:
${sectionContent.slice(0, 2000)}`,
  })

  return result.object.images[0]
}
