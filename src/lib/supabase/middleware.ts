/**
 * Supabase Middleware Helper
 *
 * Refreshes the user's session on every request.
 * This ensures the session cookie stays fresh and tokens are revalidated.
 *
 * IMPORTANT: This middleware ONLY refreshes sessions.
 * It does NOT block access to routes - authorization is handled in the DAL.
 * This follows the principle of "defense in depth" (CVE-2025-29927).
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() instead of getSession()
  // getSession() doesn't revalidate the token with the server
  // getUser() will refresh the session if the token is expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
