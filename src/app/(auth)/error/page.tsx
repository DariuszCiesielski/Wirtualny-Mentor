/**
 * Auth Error Page
 *
 * Displays authentication errors (e.g., invalid/expired verification link).
 */

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams;
  const message = params.message || "Wystąpił nieoczekiwany błąd";

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Błąd</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Jeżeli problem się powtarza, spróbuj ponownie lub skontaktuj się z
          nami.
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button asChild className="w-full">
          <Link href="/login">Wrócić do logowania</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
