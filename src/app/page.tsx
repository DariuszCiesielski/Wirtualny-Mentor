import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal/auth";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Redirect to dashboard if already logged in
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Wirtualny Mentor</h1>
          <p className="text-xl text-muted-foreground">
            Spersonalizowana platforma nauki z AI
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            Naucz się czegokolwiek z pomocą AI
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Zaloguj się</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">Zarejestruj się</Link>
          </Button>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-6">Jak to działa?</h2>
          <div className="grid gap-6 text-left max-w-md mx-auto">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium">Podaj temat</h3>
                <p className="text-sm text-muted-foreground">
                  Wpisz czego chcesz się nauczyć lub podaj link do źródła
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium">AI tworzy program</h3>
                <p className="text-sm text-muted-foreground">
                  Spersonalizowany kurs z 5 poziomami: od początkującego do guru
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium">Ucz się z mentorem</h3>
                <p className="text-sm text-muted-foreground">
                  Materiały, quizy i chatbot-mentor do pomocy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
