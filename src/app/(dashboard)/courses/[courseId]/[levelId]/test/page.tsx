/**
 * Level Test Page
 *
 * Displays the end-of-level test for a specific level.
 * Users must pass to unlock the next level, or can skip.
 */

import { notFound } from "next/navigation";
import { getCourse } from "@/lib/dal/courses";
import { requireAuth } from "@/lib/dal/auth";
import { LevelTestContainer } from "@/components/quiz/level-test-container";
import { ContentContainer } from "@/components/layout/content-container";

interface LevelTestPageProps {
  params: Promise<{
    courseId: string;
    levelId: string;
  }>;
}

export default async function LevelTestPage({ params }: LevelTestPageProps) {
  const { courseId, levelId } = await params;

  const user = await requireAuth();

  const course = await getCourse(courseId);
  if (!course || course.user_id !== user.id) {
    notFound();
  }

  const level = course.course_levels?.find((l) => l.id === levelId);
  if (!level) {
    notFound();
  }

  const isLastLevel =
    level.order_index === (course.course_levels?.length ?? 1) - 1;
  const outcomes = level.level_outcomes?.map((o) => o.description) ?? [];

  return (
    <ContentContainer className="py-8">
      <LevelTestContainer
        levelId={levelId}
        courseId={courseId}
        levelName={level.name}
        levelOrder={level.order_index}
        levelOutcomes={outcomes}
        estimatedMinutes={15}
        isLastLevel={isLastLevel}
      />
    </ContentContainer>
  );
}
