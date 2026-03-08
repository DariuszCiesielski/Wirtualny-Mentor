/**
 * Onboarding Page
 *
 * Full onboarding flow: form -> optional AI chat -> success.
 * Pre-fills with existing data if the user already has a profile.
 */

import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/onboarding/onboarding-dal";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Profil biznesowy",
};

export default async function OnboardingPage() {
  const profile = await getBusinessProfile();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <OnboardingFlow initialProfile={profile} />
    </div>
  );
}
