/**
 * Onboarding Page
 *
 * Displays the business profile form.
 * Pre-fills with existing data if the user already has a profile.
 */

import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/onboarding/onboarding-dal";
import { BusinessProfileForm } from "@/components/onboarding/business-profile-form";

export const metadata: Metadata = {
  title: "Profil biznesowy",
};

export default async function OnboardingPage() {
  const profile = await getBusinessProfile();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <BusinessProfileForm initialData={profile} />
    </div>
  );
}
