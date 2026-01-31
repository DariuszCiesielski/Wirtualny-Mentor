"use client";

/**
 * New Course Page
 *
 * Multi-step course creation flow:
 * 1. Topic - Enter learning topic and optional source URL
 * 2. Clarify - AI asks clarifying questions
 * 3. Generate - AI generates curriculum
 * 4. Preview - Review and confirm curriculum
 */

import { useState, useCallback } from "react";
import { TopicInput } from "@/components/curriculum/topic-input";
import { ClarifyingChat } from "@/components/curriculum/clarifying-chat";
import { CurriculumGenerator } from "@/components/curriculum/curriculum-generator";
import { CurriculumPreview } from "@/components/curriculum/curriculum-preview";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserInfo, Curriculum, ClarificationResponse } from "@/lib/ai/curriculum/schemas";

// Type for collected info from AI clarification
type CollectedInfo = ClarificationResponse['collectedInfo'];
import { initiateCourseCreation, saveCurriculum } from "./actions";

type Step = "topic" | "clarify" | "generate" | "preview";

interface StepConfig {
  id: Step;
  name: string;
  number: number;
}

const STEPS: StepConfig[] = [
  { id: "topic", name: "Temat", number: 1 },
  { id: "clarify", name: "Pytania", number: 2 },
  { id: "generate", name: "Generowanie", number: 3 },
  { id: "preview", name: "Podglad", number: 4 },
];

function Stepper({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Postep tworzenia kursu" className="mb-8">
      <ol className="flex items-center justify-center gap-2 md:gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex items-center gap-2 md:gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-2 border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8 md:w-16 transition-colors",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function NewCoursePage() {
  const [currentStep, setCurrentStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopicSubmit = (submittedTopic: string, submittedUrl?: string) => {
    setTopic(submittedTopic);
    setSourceUrl(submittedUrl);
    setCurrentStep("clarify");
  };

  const handleClarifyComplete = async (info: CollectedInfo) => {
    // Convert CollectedInfo to UserInfo with proper types
    const experience = (['beginner', 'intermediate', 'advanced'].includes(info.experience)
      ? info.experience
      : 'beginner') as UserInfo['experience'];

    const fullUserInfo: UserInfo = {
      topic: info.topic || topic,
      goals: info.goals || [],
      experience,
      weeklyHours: info.weeklyHours || 5,
      sourceUrl: info.sourceUrl || sourceUrl,
    };

    setUserInfo(fullUserInfo);

    // Create draft course in database
    try {
      setIsLoading(true);
      const result = await initiateCourseCreation({
        topic: fullUserInfo.topic,
        sourceUrl: fullUserInfo.sourceUrl,
        userGoals: fullUserInfo.goals,
        userExperience: fullUserInfo.experience,
        weeklyHours: fullUserInfo.weeklyHours,
      });
      setCourseId(result.courseId);
      setCurrentStep("generate");
    } catch (error) {
      console.error("Failed to create course:", error);
      // Stay on clarify step and show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerationComplete = useCallback((generatedCurriculum: Curriculum) => {
    setCurriculum(generatedCurriculum);
    setCurrentStep("preview");
  }, []);

  const handleConfirmCurriculum = async () => {
    if (!courseId || !curriculum) return;

    try {
      setIsSubmitting(true);
      await saveCurriculum(courseId, curriculum);
      // saveCurriculum redirects to /courses/[id]
    } catch (error) {
      console.error("Failed to save curriculum:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Nowy kurs</h1>
        <p className="text-muted-foreground">
          Stworz spersonalizowany program nauki z pomoca AI
        </p>
      </div>

      <Stepper currentStep={currentStep} />

      {/* Step content */}
      {currentStep === "topic" && (
        <TopicInput onSubmit={handleTopicSubmit} isLoading={isLoading} />
      )}

      {currentStep === "clarify" && (
        <ClarifyingChat
          topic={topic}
          sourceUrl={sourceUrl}
          onComplete={handleClarifyComplete}
        />
      )}

      {currentStep === "generate" && userInfo && courseId && (
        <CurriculumGenerator
          userInfo={userInfo}
          courseId={courseId}
          onComplete={handleGenerationComplete}
        />
      )}

      {currentStep === "preview" && curriculum && (
        <CurriculumPreview
          curriculum={curriculum}
          onConfirm={handleConfirmCurriculum}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
