"use server";

/**
 * Sign Up Server Action
 *
 * Creates a new user account with Supabase Auth.
 * Sends confirmation email using Supabase's built-in email.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const signUpSchema = z
  .object({
    email: z.email("Nieprawidlowy adres email"),
    password: z.string().min(8, "Haslo musi miec minimum 8 znakow"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasla jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasla nie sa takie same",
    path: ["confirmPassword"],
  });

export type SignUpState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

export async function signUp(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState> {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // Validate input
  const validatedFields = signUpSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  // Get site URL for email redirect (works in all environments)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/confirm`,
    },
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("already registered")) {
      return {
        error: "Ten adres email jest juz zarejestrowany",
      };
    }
    return {
      error: "Wystapil blad podczas rejestracji. Sprobuj ponownie.",
    };
  }

  redirect("/sign-up/check-email");
}
