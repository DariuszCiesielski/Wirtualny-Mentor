import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/dal/auth";
import { getCourse } from "@/lib/dal/courses";
import { getNotesWithContext } from "@/lib/dal/notes";
import { NotesPageClient } from "./notes-page-client";
import { searchNotesAction } from "./actions";

interface NotesPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function NotesPage({ params }: NotesPageProps) {
  const user = await requireAuth();
  const { courseId } = await params;

  // Fetch course for title and ownership verification
  const course = await getCourse(courseId);

  if (!course) {
    notFound();
  }

  // Verify ownership (RLS + defense-in-depth)
  if (course.user_id !== user.id) {
    notFound();
  }

  // Fetch all notes with context
  const notes = await getNotesWithContext(user.id, courseId);

  // Bind search action to courseId
  const boundSearchAction = searchNotesAction.bind(null, courseId);

  return (
    <NotesPageClient
      courseId={courseId}
      courseTitle={course.title}
      initialNotes={notes}
      searchAction={boundSearchAction}
    />
  );
}
