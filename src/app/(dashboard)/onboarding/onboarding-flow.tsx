"use client";

/**
 * Onboarding Flow
 *
 * Multi-step client component managing the onboarding process:
 * 1. Form - collect business profile data
 * 2. Chat - optional AI clarification conversation
 * 3. Done - success message with link to dashboard
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessProfileForm } from "@/components/onboarding/business-profile-form";
import { OnboardingChat } from "@/components/onboarding/onboarding-chat";
import type { BusinessProfile } from "@/types/onboarding";

type Step = "form" | "chat" | "done";

interface ProfileData {
  industry: string;
  role: string;
  business_goal: string;
  company_size?: string;
}

interface OnboardingFlowProps {
  initialProfile: BusinessProfile | null;
}

export function OnboardingFlow({ initialProfile }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const handleSaveAndChat = useCallback((data: ProfileData) => {
    setProfileData(data);
    setStep("chat");
  }, []);

  const handleFormSuccess = useCallback(() => {
    setStep("done");
  }, []);

  const handleChatComplete = useCallback(() => {
    setStep("done");
  }, []);

  if (step === "form") {
    return (
      <BusinessProfileForm
        initialData={initialProfile}
        onSuccess={handleFormSuccess}
        onSaveAndChat={handleSaveAndChat}
      />
    );
  }

  if (step === "chat" && profileData) {
    return (
      <OnboardingChat
        profileData={profileData}
        onComplete={handleChatComplete}
      />
    );
  }

  // Done step
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <CardTitle className="text-2xl">Profil biznesowy zapisany</CardTitle>
        <CardDescription className="text-base">
          Twoje kursy i sugestie będą teraz dostosowane do Twojego profilu
          biznesowego.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={() => router.push("/dashboard")}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Przejdź do panelu
        </Button>
      </CardContent>
    </Card>
  );
}
