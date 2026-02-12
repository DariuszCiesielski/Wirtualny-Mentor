"use client";

/**
 * New Course Page
 *
 * Multi-step course creation flow:
 * 1. Topic - Enter learning topic, upload materials, optional source URL
 * 2. Clarify - AI asks clarifying questions
 * 3. Generate - AI generates curriculum
 * 4. Preview - Review and confirm curriculum
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopicInput } from "@/components/curriculum/topic-input";
import { ClarifyingChat } from "@/components/curriculum/clarifying-chat";
import { CurriculumGenerator } from "@/components/curriculum/curriculum-generator";
import { CurriculumPreview } from "@/components/curriculum/curriculum-preview";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserInfo, Curriculum, ClarificationResponse } from "@/lib/ai/curriculum/schemas";
import type { TopicSubmitData } from "@/types/source-documents";

// Type for collected info from AI clarification
type CollectedInfo = ClarificationResponse['collectedInfo'];
import { initiateCourseCreation, saveCurriculum, linkDocumentsToCourse } from "./actions";

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
  { id: "preview", name: "Podgląd", number: 4 },
];

function Stepper({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav aria-label="Postęp tworzenia kursu" className="mb-8">
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
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [sourceUrl, setSourceUrl] = useState<string | undefined>();
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<string[]>([]);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const courseCreationStarted = useRef(false);

  const handleTopicSubmit = (data: TopicSubmitData) => {
    setTopic(data.topic);
    setSourceUrl(data.sourceUrl);
    setUploadedDocumentIds(data.uploadedDocumentIds);
    setUseWebSearch(data.useWebSearch);
    setCurrentStep("clarify");
  };

  const handleClarifyComplete = useCallback(async (info: CollectedInfo) => {
    // Prevent duplicate course creation
    if (courseCreationStarted.current) {
      return;
    }
    courseCreationStarted.current = true;

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

      // Link uploaded documents to the new course
      if (uploadedDocumentIds.length > 0) {
        await linkDocumentsToCourse(uploadedDocumentIds, result.courseId);
      }

      setCourseId(result.courseId);
      setCurrentStep("generate");
    } catch (error) {
      console.error("Failed to create course:", error);
      // Reset flag on error to allow retry
      courseCreationStarted.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [topic, sourceUrl, uploadedDocumentIds]);

  const handleGenerationComplete = useCallback((generatedCurriculum: Curriculum) => {
    setCurriculum(generatedCurriculum);
    setCurrentStep("preview");
  }, []);

  const handleConfirmCurriculum = async () => {
    if (!courseId || !curriculum) return;

    try {
      setIsSubmitting(true);
      await saveCurriculum(courseId, curriculum);
      router.push(`/courses/${courseId}`);
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
          Stwórz spersonalizowany program nauki z pomocą AI
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
          uploadedDocumentIds={uploadedDocumentIds}
          useWebSearch={useWebSearch}
          onComplete={handleClarifyComplete}
        />
      )}

      {currentStep === "generate" && userInfo && courseId && (
        <CurriculumGenerator
          userInfo={userInfo}
          courseId={courseId}
          uploadedDocumentIds={uploadedDocumentIds}
          useWebSearch={useWebSearch}
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
