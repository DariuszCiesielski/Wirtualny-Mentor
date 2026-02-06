"use client";

/**
 * Login Form Component
 *
 * Client component handling the login form with useActionState.
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
import { login, type LoginState } from "./actions";

interface LoginFormProps {
  message?: string | null;
}

export function LoginForm({ message }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginState | null, FormData>(
    login,
    null
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Zaloguj się</CardTitle>
        <CardDescription>
          Wprowadź swoje dane, aby uzyskać dostęp do platformy
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Success message (e.g., after password change) */}
        {message && (
          <div className="mb-4 rounded-md bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-600 dark:text-green-400">
            {message}
          </div>
        )}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Nie pamiętasz hasła?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-invalid={!!state?.fieldErrors?.password}
            />
            {state?.fieldErrors?.password && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zaloguj się
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <Link href="/sign-up" className="text-primary hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
