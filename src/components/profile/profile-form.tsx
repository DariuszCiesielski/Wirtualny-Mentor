"use client";

/**
 * Profile Form Component
 *
 * Allows user to update their display name.
 */

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileFormState } from "@/app/(dashboard)/profile/actions";

interface ProfileFormProps {
  initialName: string;
}

const initialState: ProfileFormState = {};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Imie</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={initialName}
          placeholder="Twoje imie"
          disabled={pending}
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {state.error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-md">
          Profil zostal zaktualizowany
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Zapisywanie..." : "Zapisz zmiany"}
      </Button>
    </form>
  );
}
