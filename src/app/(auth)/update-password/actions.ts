"use server";

/**
 * Update Password Server Action
 *
 * Updates user's password after they click the reset link.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Haslo musi miec minimum 8 znakow"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasla jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasla nie sa takie same",
    path: ["confirmPassword"],
  });

export type UpdatePasswordState = {
  error?: string;
  fieldErrors?: {
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function updatePassword(
  _prevState: UpdatePasswordState | null,
  formData: FormData
): Promise<UpdatePasswordState> {
  const rawFormData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const validatedFields = updatePasswordSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { password } = validatedFields.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      error: "Wystapil blad podczas zmiany hasla. Sprobuj ponownie.",
    };
  }

  redirect("/login?message=Haslo zostalo zmienione pomyslnie");
}
