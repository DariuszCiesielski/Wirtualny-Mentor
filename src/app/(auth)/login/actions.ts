"use server";

/**
 * Login Server Action
 *
 * Validates credentials and signs in user with Supabase Auth.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email("Nieprawidlowy adres email"),
  password: z.string().min(1, "Haslo jest wymagane"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function login(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const rawFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Validate input
  const validatedFields = loginSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: "Nieprawidlowy email lub haslo",
    };
  }

  redirect("/dashboard");
}
