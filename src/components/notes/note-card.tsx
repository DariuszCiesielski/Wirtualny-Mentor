"use client";

/**
 * Note Card Component
 *
 * Displays a single note with edit/delete actions.
 * Toggles between view and edit mode inline.
 */

import { useState, useTransition } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteNoteAction } from "@/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/actions";
import { NoteEditor } from "./note-editor";
import type { Note } from "@/types/notes";

interface NoteCardProps {
  note: Note;
  courseId: string;
  chapterId: string;
  onDelete?: () => void;
  onUpdate?: (note: Note) => void;
}

export function NoteCard({
  note,
  courseId,
  chapterId,
  onDelete,
  onUpdate,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Czy na pewno chcesz usunac te notatke?")) {
      return;
    }

    const formData = new FormData();
    formData.set("noteId", note.id);
    formData.set("courseId", courseId);

    startTransition(async () => {
      const result = await deleteNoteAction(formData);

      if ("error" in result && result.error) {
        alert(result.error);
        return;
      }

      onDelete?.();
    });
  };

  const handleUpdate = (updatedNote: Note) => {
    setIsEditing(false);
    onUpdate?.(updatedNote);
  };

  if (isEditing) {
    return (
      <NoteEditor
        courseId={courseId}
        chapterId={chapterId}
        note={note}
        onSave={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <p className="whitespace-pre-wrap text-sm">{note.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {new Date(note.created_at).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            disabled={isPending}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edytuj</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Usun</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
