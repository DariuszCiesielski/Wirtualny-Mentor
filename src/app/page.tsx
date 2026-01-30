"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function testAI() {
    setLoading(true);
    setError(null);
    setResponse("");

    try {
      const res = await fetch("/api/test-ai");

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setResponse((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
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
            Phase 1: Auth & Basic UI
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test AI Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testAI} disabled={loading} className="w-full">
              {loading ? "AI odpowiada..." : "Przetestuj AI"}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive">{error}</p>
                <p className="text-sm text-destructive/80 mt-2">
                  Sprawdz czy klucze API sa skonfigurowane w .env.local
                </p>
              </div>
            )}

            {response && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Odpowiedz AI:
                </p>
                <p className="text-foreground whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-sm mt-8">
          Kliknij przycisk powyzej aby przetestowac polaczenie z AI.
          <br />
          Wymaga skonfigurowanych kluczy API w .env.local
        </p>
      </div>
    </main>
  );
}
