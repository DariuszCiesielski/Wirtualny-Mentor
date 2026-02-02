/**
 * Dashboard Home Page
 *
 * Welcome page for authenticated users with feature overview.
 */

import { getUser } from "@/lib/dal/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, FileText, MessageCircle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();
  const displayName =
    (user?.user_metadata?.full_name as string) || user?.email || "Użytkownik";

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Witaj, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Zacznij od utworzenia pierwszego kursu lub przeglądnij swoje notatki.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Moje kursy */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Moje kursy</CardTitle>
                <CardDescription>Wkrótce dostępne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tworzenie spersonalizowanych programów nauczania z pomocą AI.
            </p>
          </CardContent>
        </Card>

        {/* Notatki */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notatki</CardTitle>
                <CardDescription>Wkrótce dostępne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organizacja materiałów i notatek z nauki.
            </p>
          </CardContent>
        </Card>

        {/* Mentor AI */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Mentor AI</CardTitle>
                <CardDescription>Wkrótce dostępne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Rozmowy z AI mentorem w stylu sokratycznym.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting started info */}
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
    </div>
  );
}
