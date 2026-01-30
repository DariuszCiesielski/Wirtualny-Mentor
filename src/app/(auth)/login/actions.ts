"use server";

/**
 * Login Server Action
 *
 * Validates credentials and signs in user with Supabase Auth.
 * Supports mock auth mode for testing without Supabase.
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

// Check if mock auth is enabled
function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

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

  // Mock auth mode
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

    redirect("/dashboard");
  }

  // Real Supabase auth
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
