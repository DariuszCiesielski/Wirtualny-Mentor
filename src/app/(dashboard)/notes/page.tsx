/**
 * Global Notes Page
 *
 * Shows all user notes across all courses, grouped by course.
 */

import { requireAuth } from "@/lib/dal/auth";
import { getAllUserNotes } from "@/lib/dal/notes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContentContainer } from "@/components/layout/content-container";
import { FileText, BookOpen, ArrowRight } from "lucide-react";
import type { NoteWithContext } from "@/types/notes";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByCourse(notes: NoteWithContext[]) {
  const groups = new Map<
    string,
    { courseTitle: string; notes: NoteWithContext[] }
  >();

  for (const note of notes) {
    const key = note.course_id;
    if (!groups.has(key)) {
      groups.set(key, {
        courseTitle: note.course_title ?? "Kurs bez nazwy",
        notes: [],
      });
    }
    groups.get(key)!.notes.push(note);
  }

  return Array.from(groups.entries());
}

export default async function NotesPage() {
  const user = await requireAuth();
  const notes = await getAllUserNotes(user.id);

  const courseGroups = groupByCourse(notes);

  return (
    <ContentContainer className="py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Moje notatki
        </h1>
        <p className="text-muted-foreground mt-2">
          Wszystkie notatki ze wszystkich kursów
        </p>
      </header>

      {notes.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak notatek</h3>
            <p className="text-muted-foreground mb-4">
              Nie masz jeszcze żadnych notatek.
              <br />
              Dodawaj notatki podczas nauki w rozdziałach kursów.
            </p>
            <Button asChild variant="outline">
              <Link href="/courses">
                Przejdź do kursów
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {courseGroups.map(([courseId, group]) => (
            <section key={courseId}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {group.courseTitle}
                  <Badge variant="secondary" className="ml-2">
                    {group.notes.length}
                  </Badge>
                </h2>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/courses/${courseId}/notes`}>
                    Wszystkie
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {group.notes.map((note) => (
                  <Card key={note.id} className="py-4">
                    <CardContent className="px-4 py-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {note.level_name && (
                          <Badge variant="secondary" className="text-xs">
                            {note.level_name}
                          </Badge>
                        )}
                        {note.chapter_title && (
                          <Badge
                            variant="outline"
                            className="text-xs flex items-center gap-1"
                          >
                            <BookOpen className="h-3 w-3" />
                            {note.chapter_title}
                          </Badge>
                        )}
                      </div>
                      <p className="text-foreground whitespace-pre-wrap line-clamp-3">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-3">
                        {formatDate(note.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </ContentContainer>
  );
}
