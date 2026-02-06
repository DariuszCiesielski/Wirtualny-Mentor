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
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
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
      error: "Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.",
    };
  }

  redirect("/login?message=Hasło zostało zmienione pomyślnie");
}
