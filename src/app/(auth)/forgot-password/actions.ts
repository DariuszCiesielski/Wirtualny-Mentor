"use server";

/**
 * Reset Password Server Action
 *
 * Sends password reset email via Supabase Auth.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.email("Nieprawidłowy adres email"),
});

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
  };
};

export async function resetPassword(
  _prevState: ResetPasswordState | null,
  formData: FormData
): Promise<ResetPasswordState> {
  const rawFormData = {
    email: formData.get("email") as string,
  };

  // Validate input
  const validatedFields = resetPasswordSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email } = validatedFields.data;

  const supabase = await createClient();

  // Get site URL for email redirect (works in all environments)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/confirm?next=/update-password`,
  });

  if (error) {
    return {
      error: "Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie.",
    };
  }

  redirect("/forgot-password/check-email");
}
