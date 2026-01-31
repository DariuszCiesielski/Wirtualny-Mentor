"use client";

/**
 * Chapter Navigation Component
 *
 * Provides previous/next chapter navigation and link to table of contents.
 * Adapts button styles based on completion status.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";

interface ChapterNavigationProps {
  courseId: string;
  prevChapter: { levelId: string; chapterId: string } | null;
  nextChapter: { levelId: string; chapterId: string } | null;
  isCompleted: boolean;
}

export function ChapterNavigation({
  courseId,
  prevChapter,
  nextChapter,
  isCompleted,
}: ChapterNavigationProps) {
  return (
    <div className="flex items-center justify-between border-t pt-6">
      {prevChapter ? (
        <Button variant="outline" asChild>
          <Link
            href={`/courses/${courseId}/${prevChapter.levelId}/${prevChapter.chapterId}`}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Poprzedni rozdzial
          </Link>
        </Button>
      ) : (
        <div /> // Spacer
      )}

      <Button variant="outline" asChild>
        <Link href={`/courses/${courseId}`}>
          <BookOpen className="h-4 w-4 mr-2" />
          Spis tresci
        </Link>
      </Button>

      {nextChapter ? (
        <Button variant={isCompleted ? "default" : "outline"} asChild>
          <Link
            href={`/courses/${courseId}/${nextChapter.levelId}/${nextChapter.chapterId}`}
          >
            Nastepny rozdzial
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      ) : (
        <Button variant="default" asChild>
          <Link href={`/courses/${courseId}`}>Zakoncz kurs</Link>
        </Button>
      )}
    </div>
  );
}
