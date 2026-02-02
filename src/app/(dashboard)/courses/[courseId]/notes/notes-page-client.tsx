"use client";

/**
 * Notes Page Client Component
 *
 * Displays all notes for a course with search functionality.
 * Server component passes initial notes, client handles interactivity.
 */

import { useState } from "react";
import Link from "next/link";
import { NotesSearch } from "@/components/notes/notes-search";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, BookOpen } from "lucide-react";
import type { NoteWithContext } from "@/types/notes";

interface NotesPageClientProps {
  courseId: string;
  courseTitle: string;
  initialNotes: NoteWithContext[];
  /** Server action for searching notes - passed from server component */
  searchAction: (query: string) => Promise<NoteWithContext[]>;
}

export function NotesPageClient({
  courseId,
  courseTitle,
  initialNotes,
  searchAction,
}: NotesPageClientProps) {
  const [notes] = useState(initialNotes);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <header className="mb-8">
        <Link
          href={`/courses/${courseId}`}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Powrót do kursu
        </Link>

        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8" />
          Moje notatki
        </h1>
        <p className="text-muted-foreground mt-2">
          {courseTitle}
        </p>
      </header>

      {/* Search */}
      <section className="mb-8">
        <NotesSearch courseId={courseId} searchAction={searchAction} />
      </section>

      {/* Notes List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Wszystkie notatki ({notes.length})
        </h2>

        {notes.length === 0 ? (
          <EmptyState courseId={courseId} />
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteItem key={note.id} note={note} courseId={courseId} formatDate={formatDate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface NoteItemProps {
  note: NoteWithContext;
  courseId: string;
  formatDate: (date: string) => string;
}

function NoteItem({ note, courseId, formatDate }: NoteItemProps) {
  // Determine the link based on chapter availability
  // We need level_id to navigate to chapter - for now just show note
  // In production, you'd include level_id in NoteWithContext

  return (
    <Card id={`note-${note.id}`} className="py-4">
      <CardContent className="px-4 py-0">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Context badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {note.level_name && (
                <Badge variant="secondary" className="text-xs">
                  {note.level_name}
                </Badge>
              )}
              {note.chapter_title && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {note.chapter_title}
                </Badge>
              )}
            </div>

            {/* Note content */}
            <p className="text-foreground whitespace-pre-wrap">
              {note.content}
            </p>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-3">
              Utworzono: {formatDate(note.created_at)}
              {note.updated_at !== note.created_at && (
                <span className="ml-2">
                  (edytowano: {formatDate(note.updated_at)})
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  courseId: string;
}

function EmptyState({ courseId }: EmptyStateProps) {
  return (
    <Card className="py-12">
      <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Brak notatek</h3>
        <p className="text-muted-foreground mb-4">
          Nie masz jeszcze żadnych notatek w tym kursie.
          <br />
          Dodawaj notatki podczas nauki w rozdziałach.
        </p>
        <Button asChild variant="outline">
          <Link href={`/courses/${courseId}`}>
            Przejdź do kursu
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
