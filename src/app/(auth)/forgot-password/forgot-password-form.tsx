"use client";

/**
 * Forgot Password Form Component
 *
 * Client component handling the password reset request form.
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
import { resetPassword, type ResetPasswordState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<ResetPasswordState | null, FormData>(
    resetPassword,
    null
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Resetuj haslo</CardTitle>
        <CardDescription>
          Podaj swoj adres email, a wyslemy Ci link do zmiany hasla
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Wyslij link resetujacy
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Wrociles?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Zaloguj sie
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
