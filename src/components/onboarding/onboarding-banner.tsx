"use client";

/**
 * Onboarding Banner Component
 *
 * Displays a banner on the dashboard encouraging users to complete
 * their business profile. Dismissible per session (useState).
 */

import { useState } from "react";
import Link from "next/link";
import { Briefcase, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border bg-primary/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Uzupełnij profil biznesowy</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pomóż AI lepiej dopasować kursy do Twojej branży i celów.
          </p>
          <Button asChild variant="link" size="sm" className="px-0 mt-1 h-auto">
            <Link href="/onboarding">
              Uzupełnij profil
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 -mt-1 -mr-1"
          onClick={() => setDismissed(true)}
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
