"use server";

/**
 * Logout Server Action
 *
 * Signs out user and clears session cookies.
 * Supports both real Supabase auth and mock auth.
 */

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Check if mock auth is enabled
function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

export async function logout() {
  const cookieStore = await cookies();

  // Mock auth mode - just delete the cookie
  if (isMockAuth()) {
    cookieStore.delete("mock_auth_user");
    redirect("/login");
  }

  // Real Supabase auth
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}
