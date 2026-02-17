/**
 * Data Access Layer - Admin User Management
 *
 * CRUD for wm_allowed_users table.
 * All operations use the service role client (bypasses RLS).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { AllowedUser, UpdateUserInput } from "@/types/admin";

/**
 * List all whitelist users. Requires admin role (checked in Route Handler).
 */
export async function listAllowedUsers(): Promise<AllowedUser[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("wm_allowed_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return (data ?? []) as AllowedUser[];
}

/**
 * Create a new user in Supabase Auth + add to whitelist.
 * Rolls back auth user creation if whitelist insert fails.
 */
export async function createAllowedUser(
  email: string,
  password: string,
  role: "admin" | "user",
  displayName: string | undefined,
  invitedBy: string
): Promise<AllowedUser> {
  const admin = createAdminClient();

  // 1. Check if email already on whitelist
  const { data: existing } = await admin
    .from("wm_allowed_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    throw new Error("Ten adres email jest już na liście dostępu");
  }

  // 2. Check if user already exists in Supabase Auth
  const { data: authList } = await admin.auth.admin.listUsers();
  const existingAuthUser = authList?.users?.find((u) => u.email === email);

  let authUserId: string;

  if (existingAuthUser) {
    // User exists in Auth (e.g. registered before whitelist) — update password
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existingAuthUser.id,
      { password, email_confirm: true }
    );
    if (updateError) {
      throw new Error(`Błąd aktualizacji konta: ${updateError.message}`);
    }
    authUserId = existingAuthUser.id;
  } else {
    // Create new auth user
    const { data: authData, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new Error(
        `Błąd tworzenia konta: ${authError?.message ?? "Nieznany błąd"}`
      );
    }
    authUserId = authData.user.id;
  }

  // 3. Add to whitelist
  const { data, error } = await admin
    .from("wm_allowed_users")
    .insert({
      email,
      user_id: authUserId,
      role,
      display_name: displayName ?? null,
    })
    .select()
    .single();

  if (error) {
    // Rollback — only delete auth user if we just created them
    if (!existingAuthUser) {
      await admin.auth.admin.deleteUser(authUserId);
    }
    throw new Error(`Błąd dodawania do listy: ${error.message}`);
  }

  return data as AllowedUser;
}

/**
 * Update role and/or display name of a whitelist user.
 */
export async function updateAllowedUser(
  allowedUserId: string,
  input: UpdateUserInput
): Promise<AllowedUser> {
  const admin = createAdminClient();

  const updateData: Record<string, unknown> = {};
  if (input.role !== undefined) updateData.role = input.role;
  if (input.display_name !== undefined)
    updateData.display_name = input.display_name;

  const { data, error } = await admin
    .from("wm_allowed_users")
    .update(updateData)
    .eq("id", allowedUserId)
    .select()
    .single();

  if (error) {
    throw new Error(`Błąd aktualizacji: ${error.message}`);
  }

  return data as AllowedUser;
}

/**
 * Delete a user from whitelist + delete their Supabase Auth account.
 * Protects against self-deletion.
 */
export async function deleteAllowedUser(
  allowedUserId: string,
  requestingAdminId: string
): Promise<void> {
  const admin = createAdminClient();

  // Fetch entry (need user_id for auth deletion)
  const { data: entry, error: fetchError } = await admin
    .from("wm_allowed_users")
    .select("id, user_id, email")
    .eq("id", allowedUserId)
    .single();

  if (fetchError || !entry) {
    throw new Error("Użytkownik nie znaleziony");
  }

  // Self-delete protection
  if (entry.user_id === requestingAdminId) {
    throw new Error("Nie możesz usunąć własnego konta");
  }

  // 1. Delete from whitelist
  const { error: deleteError } = await admin
    .from("wm_allowed_users")
    .delete()
    .eq("id", allowedUserId);

  if (deleteError) {
    throw new Error(`Błąd usuwania: ${deleteError.message}`);
  }

  // 2. Delete auth account (if user had registered)
  if (entry.user_id) {
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(
      entry.user_id
    );
    if (authDeleteError) {
      console.error(
        `Warning: failed to delete auth user ${entry.user_id}:`,
        authDeleteError.message
      );
    }
  }
}
