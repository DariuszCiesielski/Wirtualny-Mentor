"use client";

/**
 * Sign Up Form Component
 *
 * Client component handling the sign-up form with useActionState.
 */

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signUp, type SignUpState } from "./actions";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState<SignUpState | null, FormData>(
    signUp,
    null
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Utworz konto</CardTitle>
        <CardDescription>
          Wprowadz swoje dane, aby rozpoczac nauke
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Error message */}
        {state?.error && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jan@example.com"
              required
              autoComplete="email"
              aria-invalid={!!state?.fieldErrors?.email}
            />
            {state?.fieldErrors?.email && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Haslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 znakow"
              required
              autoComplete="new-password"
              aria-invalid={!!state?.fieldErrors?.password}
            />
            {state?.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdz haslo</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Powtorz haslo"
              required
              autoComplete="new-password"
              aria-invalid={!!state?.fieldErrors?.confirmPassword}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zarejestruj sie
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Masz juz konto?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Zaloguj sie
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
