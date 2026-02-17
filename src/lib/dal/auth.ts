/**
 * Data Access Layer - Authentication
 *
 * Centralized authentication verification functions.
 * These should be used in protected pages, layouts, and Server Actions.
 *
 * IMPORTANT: Do NOT rely solely on middleware for auth checks.
 * Always verify the session close to where data is accessed (DAL pattern).
 *
 * Supports mock auth mode for testing without Supabase.
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserRole, UserAccessResult } from "@/types/admin";

// Check if mock auth is enabled
function isMockAuth(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

// Mock user type that matches Supabase User structure
interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Get the current authenticated user.
 *
 * This function is cached per-request using React's cache().
 * Multiple calls within the same request will only hit the database once.
 *
 * @returns The authenticated user or null if not logged in
 */
export const getUser = cache(async (): Promise<User | null> => {
  // Mock auth mode
  if (isMockAuth()) {
    const cookieStore = await cookies();
    const mockUserCookie = cookieStore.get("mock_auth_user");

    if (!mockUserCookie?.value) {
      return null;
    }

    try {
      const mockUser: MockUser = JSON.parse(mockUserCookie.value);
      // Return mock user as Supabase User-like object
      return {
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: mockUser.user_metadata,
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
    } catch {
      return null;
    }
  }

  // Real Supabase auth
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
});

/**
 * Require authentication for a page or component.
 *
 * Use this in protected pages that should redirect to login if not authenticated.
 *
 * @throws Redirects to /login if not authenticated
 * @returns The authenticated user
 *
 * @example
 * ```tsx
 * // app/(dashboard)/page.tsx
 * export default async function DashboardPage() {
 *   const user = await requireAuth();
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export async function requireAuth(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Verify the session in a Server Action.
 *
 * Use this at the start of Server Actions that require authentication.
 * Unlike requireAuth(), this throws an error instead of redirecting.
 *
 * @throws Error if not authenticated
 * @returns The authenticated user
 *
 * @example
 * ```tsx
 * // app/actions.ts
 * 'use server'
 *
 * export async function updateProfile(formData: FormData) {
 *   const user = await verifySession();
 *   // ... update logic
 * }
 * ```
 */
export async function verifySession(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

// ============================================================================
// WHITELIST / ACCESS CONTROL
// ============================================================================

/**
 * Check if the authenticated user is on the whitelist and get their role.
 *
 * Queries wm_allowed_users by email. If the entry exists but user_id is null
 * (e.g. admin added user before they registered), syncs the user_id.
 *
 * Cached per-request via React cache().
 */
export const getUserAccess = cache(
  async (): Promise<UserAccessResult> => {
    const user = await getUser();

    if (!user?.email) {
      return { hasAccess: false, role: null, allowedUserId: null };
    }

    // Mock auth mode — treat all mock users as admin
    if (isMockAuth()) {
      return { hasAccess: true, role: "admin", allowedUserId: user.id };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("wm_allowed_users")
      .select("id, role, user_id")
      .eq("email", user.email)
      .maybeSingle();

    if (error || !data) {
      return { hasAccess: false, role: null, allowedUserId: null };
    }

    // Sync user_id on first login (entry was created before user registered)
    if (!data.user_id) {
      const admin = createAdminClient();
      await admin
        .from("wm_allowed_users")
        .update({ user_id: user.id })
        .eq("id", data.id);
    }

    return {
      hasAccess: true,
      role: data.role as UserRole,
      allowedUserId: data.id,
    };
  }
);

/**
 * Require user to be authenticated AND on the whitelist.
 *
 * Redirects to /login if not authenticated, /unauthorized if not on whitelist.
 */
export async function requireAllowedUser(): Promise<{
  user: User;
  role: UserRole;
  allowedUserId: string;
}> {
  const user = await requireAuth();
  const access = await getUserAccess();

  if (!access.hasAccess || !access.role || !access.allowedUserId) {
    redirect("/unauthorized");
  }

  return { user, role: access.role, allowedUserId: access.allowedUserId };
}

/**
 * Require admin role. Redirects to /unauthorized if not admin.
 */
export async function requireAdmin(): Promise<{
  user: User;
  role: "admin";
  allowedUserId: string;
}> {
  const { user, role, allowedUserId } = await requireAllowedUser();

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return { user, role: "admin", allowedUserId };
}
