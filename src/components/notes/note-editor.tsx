"use client";

/**
 * Note Editor Component
 *
 * Form for creating and editing user notes.
 * Uses useTransition for pending state and optimistic updates.
 */

import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";
import {
  createNoteAction,
  updateNoteAction,
} from "@/app/(dashboard)/courses/[courseId]/[levelId]/[chapterId]/actions";
import type { Note } from "@/types/notes";

interface NoteEditorProps {
  courseId: string;
  chapterId: string;
  /** If provided, edit mode instead of create */
  note?: Note;
  /** Callback after successful save */
  onSave?: (note: Note) => void;
  /** Callback to cancel edit mode */
  onCancel?: () => void;
}

export function NoteEditor({
  courseId,
  chapterId,
  note,
  onSave,
  onCancel,
}: NoteEditorProps) {
  const [content, setContent] = useState(note?.content ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!note;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Notatka nie może być pusta");
      return;
    }

    const formData = new FormData();
    formData.set("content", content);
    formData.set("courseId", courseId);
    formData.set("chapterId", chapterId);

    if (isEditMode && note) {
      formData.set("noteId", note.id);
    }

    startTransition(async () => {
      const result = isEditMode
        ? await updateNoteAction(formData)
        : await createNoteAction(formData);

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      if ("data" in result && result.data) {
        onSave?.(result.data);
        if (!isEditMode) {
          setContent(""); // Clear after create
        }
      }
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4">
          <Textarea
            placeholder="Dodaj notatkę do tego rozdziału..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={isPending}
            className="resize-none"
          />
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          {isEditMode && onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Anuluj
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isEditMode ? "Zapisz zmiany" : "Zapisz notatkę"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
