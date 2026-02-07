/**
 * Dashboard Home Page
 *
 * Welcome page with user's courses, recent notes, and quick actions.
 */

import { requireAuth } from "@/lib/dal/auth";
import { getUserCourses } from "@/lib/dal/courses";
import { getAllUserNotes } from "@/lib/dal/notes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  MessageCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const displayName =
    (user?.user_metadata?.full_name as string) || user?.email || "Użytkownik";

  const [courses, recentNotes] = await Promise.all([
    getUserCourses(user.id),
    getAllUserNotes(user.id, 5),
  ]);

  const activeCourses = courses.filter((c) => c.status === "active");
  const hasCourses = courses.length > 0;
  const hasNotes = recentNotes.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Witaj, {displayName}!
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasCourses
              ? `Masz ${courses.length} ${courses.length === 1 ? "kurs" : courses.length < 5 ? "kursy" : "kursów"}.`
              : "Zacznij od utworzenia pierwszego kursu."}
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            Nowy kurs
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Moje kursy */}
        <Link href="/courses">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Moje kursy</CardTitle>
                  <CardDescription>
                    {courses.length}{" "}
                    {courses.length === 1
                      ? "kurs"
                      : courses.length < 5
                        ? "kursy"
                        : "kursów"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {hasCourses
                  ? "Przeglądaj i kontynuuj naukę."
                  : "Utwórz swój pierwszy kurs z pomocą AI."}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Notatki */}
        <Link href="/notes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notatki</CardTitle>
                  <CardDescription>
                    {recentNotes.length > 0
                      ? `${recentNotes.length}+ notatek`
                      : "Brak notatek"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {hasNotes
                  ? "Przeglądaj swoje notatki z nauki."
                  : "Dodawaj notatki podczas nauki w rozdziałach."}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Mentor AI */}
        <Card
          className={
            activeCourses.length > 0
              ? "hover:shadow-md transition-shadow h-full"
              : "opacity-60 h-full"
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Mentor AI</CardTitle>
                <CardDescription>
                  {activeCourses.length > 0
                    ? "Rozmowy z mentorem"
                    : "Utwórz kurs, aby rozmawiać"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeCourses.length > 0 ? (
              <div className="space-y-2">
                {activeCourses.slice(0, 3).map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}/chat`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="truncate">{course.title}</span>
                    <ArrowRight className="h-3 w-3 ml-auto shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rozmowy z AI mentorem w stylu sokratycznym.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent courses */}
      {hasCourses && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ostatnie kursy</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/courses">
                Wszystkie
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course) => {
              const completedChapters =
                course.user_progress?.completed_chapters.length || 0;
              const totalChapters = course.total_chapters || 0;
              const percentage =
                totalChapters > 0
                  ? Math.round((completedChapters / totalChapters) * 100)
                  : 0;

              const statusLabel = {
                draft: "Szkic",
                generating: "Generowanie...",
                active: "W trakcie",
                completed: "Ukończony",
                archived: "Archiwum",
              }[course.status];

              return (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base line-clamp-2">
                          {course.title}
                        </CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          {statusLabel}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {course.status === "active" && totalChapters > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>
                              {completedChapters} z {totalChapters} rozdziałów
                            </span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent notes */}
      {hasNotes && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ostatnie notatki</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/notes">
                Wszystkie
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <Card key={note.id} className="py-3">
                <CardContent className="px-4 py-0">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {note.course_title && (
                      <Badge variant="outline" className="text-xs">
                        {note.course_title}
                      </Badge>
                    )}
                    {note.chapter_title && (
                      <Badge
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3" />
                        {note.chapter_title}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {note.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {formatDate(note.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Getting started - only when no courses */}
      {!hasCourses && (
        <Card>
          <CardHeader>
            <CardTitle>Jak zacząć?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wirtualny Mentor pomoże Ci stworzyć spersonalizowany program nauki
              dowolnego tematu. AI przeanalizuje Twoje cele i stworzy curriculum
              krok po kroku.
            </p>
            <div className="text-sm text-muted-foreground">
              <ol className="list-inside list-decimal space-y-2">
                <li>Utwórz nowy kurs podając temat, który chcesz poznać</li>
                <li>AI wygeneruje program nauczania dopasowany do Ciebie</li>
                <li>Ucz się krok po kroku z pomocą AI mentora</li>
                <li>Twórz notatki i śledź postępy</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
