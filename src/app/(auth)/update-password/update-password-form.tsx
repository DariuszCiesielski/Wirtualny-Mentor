"use client";

/**
 * Update Password Form Component
 *
 * Client component for setting a new password after reset.
 */

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updatePassword, type UpdatePasswordState } from "./actions";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState<UpdatePasswordState | null, FormData>(
    updatePassword,
    null
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Ustaw nowe hasło</CardTitle>
        <CardDescription>
          Wprowadź swoje nowe hasło poniżej
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
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 znaków"
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
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Powtórz hasło"
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
            Ustaw nowe hasło
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
