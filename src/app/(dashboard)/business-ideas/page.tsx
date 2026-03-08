/**
 * Business Ideas Page (Server Component)
 *
 * Shows bookmarked business suggestions with filtering and sorting.
 * Reads contact info from environment variables (server-only).
 */

import { requireAuth } from "@/lib/dal/auth";
import {
  getBookmarkedSuggestions,
  getCoursesWithBookmarks,
} from "@/lib/business-ideas/ideas-dal";
import { ContentContainer } from "@/components/layout/content-container";
import { BusinessIdeasClient } from "@/components/business-ideas/BusinessIdeasClient";
import type { ContactInfo } from "@/types/business-ideas";

export default async function BusinessIdeasPage() {
  const user = await requireAuth();

  const [suggestions, courses] = await Promise.all([
    getBookmarkedSuggestions(user.id),
    getCoursesWithBookmarks(user.id),
  ]);

  // Read contact info from server-only env vars
  const email = process.env.CONTACT_EMAIL || null;
  const phone = process.env.CONTACT_PHONE || null;
  const formUrl = process.env.CONTACT_FORM_URL || null;

  const contactInfo: ContactInfo | null =
    email || phone || formUrl ? { email, phone, formUrl } : null;

  return (
    <ContentContainer className="py-8">
      <BusinessIdeasClient
        suggestions={suggestions}
        courses={courses}
        contactInfo={contactInfo}
      />
    </ContentContainer>
  );
}
