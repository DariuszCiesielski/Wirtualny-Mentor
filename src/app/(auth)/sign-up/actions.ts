"use server";

/**
 * Sign Up Server Action
 *
 * Creates a new user account with Supabase Auth.
 * Supports mock auth mode for testing without Supabase.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";

const signUpSchema = z
  .object({
    email: z.email("Nieprawidłowy adres email"),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
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

// Check if mock auth is enabled
function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

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

  // Mock auth mode - skip email confirmation, directly log in
  if (isMockAuth()) {
    const mockUser = {
      id: crypto.randomUUID(),
      email,
      user_metadata: {
        full_name: email.split("@")[0],
      },
    };

    const cookieStore = await cookies();
    cookieStore.set("mock_auth_user", JSON.stringify(mockUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // In mock mode, go directly to dashboard
    redirect("/dashboard");
  }

  // Real Supabase auth
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
        error: "Ten adres email jest już zarejestrowany",
      };
    }
    return {
      error: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
    };
  }

  redirect("/sign-up/check-email");
}
