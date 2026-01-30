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
    (user?.user_metadata?.full_name as string) || user?.email || "Uzytkownik";

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Witaj, {displayName}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Zacznij od utworzenia pierwszego kursu lub przegladnij swoje notatki.
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
                <CardDescription>Wkrotce dostepne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tworzenie spersonalizowanych programow nauczania z pomoca AI.
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
                <CardDescription>Wkrotce dostepne</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organizacja materialow i notatek z nauki.
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
                <CardDescription>Wkrotce dostepne</CardDescription>
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
          <CardTitle>Jak zaczac?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Wirtualny Mentor pomoze Ci stworzyc spersonalizowany program nauki
            dowolnego tematu. AI przeanalizuje Twoje cele i stworzy curriculum
            krok po kroku.
          </p>
          <div className="text-sm text-muted-foreground">
            <ol className="list-inside list-decimal space-y-2">
              <li>Utworz nowy kurs podajac temat, ktory chcesz poznac</li>
              <li>AI wygeneruje program nauczania dopasowany do Ciebie</li>
              <li>Ucz sie krok po kroku z pomoca AI mentora</li>
              <li>Tworzuj notatki i sledzisz posteepy</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
