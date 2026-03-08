/**
 * AI prompt builder for Business Suggestions
 *
 * Generates system + user prompts for generateObject.
 * Branches on whether user has a business profile (personalized vs universal).
 */

import type { BusinessProfile } from "@/types/onboarding";

export const PROMPT_VERSION = "1.0";

interface BuildPromptParams {
  chapterTitle: string;
  content: string;
  courseTopic?: string;
  profile: BusinessProfile | null;
}

/**
 * Build the system + user prompt for suggestion generation.
 * Truncates content to ~4000 chars for cost efficiency.
 */
export function buildSuggestionPrompt(params: BuildPromptParams): {
  system: string;
  prompt: string;
} {
  const { chapterTitle, content, courseTopic, profile } = params;

  // Extract h2 headings from content
  const headings =
    content.match(/^## (.+)$/gm)?.map((h) => h.replace("## ", "")) || [];

  // Truncate content
  const truncated =
    content.length > 4000
      ? content.slice(0, 4000) + "\n...[tresc skrocona]..."
      : content;

  const system = buildSystemPrompt(profile);

  const prompt = buildUserPrompt({
    chapterTitle,
    truncated,
    courseTopic,
    headings,
    profile,
  });

  return { system, prompt };
}

function buildSystemPrompt(profile: BusinessProfile | null): string {
  const base = `Jestes ekspertem od zastosowania wiedzy w biznesie.

Twoje zadanie: przeanalizuj tresc lekcji edukacyjnej i zaproponuj 1 konkretny pomysl biznesowy, ktory mozna zrealizowac wykorzystujac wiedze z tej lekcji.

Zasady:
- Pomysl MUSI byc praktyczny i mozliwy do realizacji
- Opis po polsku, zwiezly ale konkretny
- business_potential: realistyczna ocena, nie marketingowe slogany
- estimated_complexity: prosty (solo, weekend), sredni (plan + budzet), zlozony (zespol + inwestycja)
- relevant_section: DOKLADNA kopia naglowka h2 z listy dostepnych sekcji
- Jesli tresc lekcji nie daje inspiracji biznesowej — zwroc pusta tablice suggestions
- NIE wymyslaj na sile — lepiej 0 sugestii niz slaba sugestia`;

  if (profile) {
    const personalization = buildPersonalizationBlock(profile);
    return `${base}

PROFIL UZYTKOWNIKA:
${personalization}

Dostosuj sugestie do profilu uzytkownika — jego branzy, roli i celow biznesowych.
Jesli profil jest czesciowy, wykorzystaj dostepne informacje.`;
  }

  return `${base}

Uzytkownik nie ma profilu biznesowego. Zaproponuj uniwersalny pomysl, ktory moze zrealizowac osoba z dowolnej branzy.`;
}

function buildPersonalizationBlock(profile: BusinessProfile): string {
  const lines: string[] = [];

  if (profile.industry) lines.push(`- Branza: ${profile.industry}`);
  if (profile.role) lines.push(`- Rola: ${profile.role}`);
  if (profile.business_goal)
    lines.push(`- Cel biznesowy: ${profile.business_goal}`);
  if (profile.company_size)
    lines.push(`- Wielkosc firmy: ${profile.company_size}`);
  if (profile.experience_summary)
    lines.push(`- Doswiadczenie: ${profile.experience_summary}`);

  return lines.length > 0 ? lines.join("\n") : "(brak danych)";
}

function buildUserPrompt(params: {
  chapterTitle: string;
  truncated: string;
  courseTopic?: string;
  headings: string[];
  profile: BusinessProfile | null;
}): string {
  const { chapterTitle, truncated, courseTopic, headings } = params;

  return `Tytul rozdzialu: "${chapterTitle}"
${courseTopic ? `Temat kursu: "${courseTopic}"` : ""}

Dostepne sekcje (h2):
${headings.length > 0 ? headings.map((h) => `- ${h}`).join("\n") : "(brak sekcji h2)"}

Tresc lekcji:
${truncated}`;
}
