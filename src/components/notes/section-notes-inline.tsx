'use client';

/**
 * Section Notes Inline
 *
 * Panel of notes rendered inline under an h2 heading.
 * Includes a compact editor for adding notes and displays existing notes.
 */

import { NoteEditor } from './note-editor';
import { NoteCard } from './note-card';
import type { Note } from '@/types/notes';

interface SectionNotesInlineProps {
  notes: Note[];
  sectionHeading: string;
  courseId: string;
  chapterId: string;
  onAdd?: (note: Note) => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

export function SectionNotesInline({
  notes,
  sectionHeading,
  courseId,
  chapterId,
  onAdd,
  onUpdate,
  onDelete,
}: SectionNotesInlineProps) {
  return (
    <div className="not-prose mb-6 space-y-2 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3">
      <NoteEditor
        courseId={courseId}
        chapterId={chapterId}
        sectionHeading={sectionHeading}
        compact
        onSave={onAdd}
      />

      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              courseId={courseId}
              chapterId={chapterId}
              onUpdate={onUpdate}
              onDelete={() => onDelete?.(note.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
