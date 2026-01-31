"use client";

/**
 * Notes List Component
 *
 * Displays the note editor and list of notes for a chapter.
 * Manages local state for optimistic UI updates.
 */

import { useState } from "react";
import { NoteEditor } from "./note-editor";
import { NoteCard } from "./note-card";
import { StickyNote } from "lucide-react";
import type { Note } from "@/types/notes";

interface NotesListProps {
  courseId: string;
  chapterId: string;
  initialNotes: Note[];
}

export function NotesList({ courseId, chapterId, initialNotes }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const handleCreate = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdate = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  };

  const handleDelete = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Notatki</h2>
        <span className="text-sm text-muted-foreground">({notes.length})</span>
      </div>

      <NoteEditor
        courseId={courseId}
        chapterId={chapterId}
        onSave={handleCreate}
      />

      {notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              courseId={courseId}
              chapterId={chapterId}
              onUpdate={handleUpdate}
              onDelete={() => handleDelete(note.id)}
            />
          ))}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Brak notatek. Dodaj pierwsza notatke powyzej.
        </p>
      )}
    </section>
  );
}
