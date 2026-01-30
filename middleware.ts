/**
 * Next.js Middleware
 *
 * This middleware runs on every request and refreshes the Supabase session.
 *
 * IMPORTANT: This middleware does NOT block access to routes.
 * Authorization is handled in the Data Access Layer (DAL) within pages/actions.
 * This follows the "defense in depth" principle (CVE-2025-29927).
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static files with common extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
