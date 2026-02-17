/**
 * Supabase Admin Client (Service Role)
 *
 * This client bypasses RLS and has full database access.
 * Use ONLY in:
 * - Route Handlers (src/app/api/admin/*)
 * - DAL functions that need admin-level access
 *
 * NEVER export to client components!
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY env variable
 */

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
