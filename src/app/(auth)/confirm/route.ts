/**
 * Email Confirmation Route Handler
 *
 * Handles email verification for both:
 * - Sign-up confirmation (type: 'email')
 * - Password reset (type: 'recovery')
 *
 * Supabase sends users here with token_hash and type in URL params.
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "recovery" | "email" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  // Get origin for redirects
  const origin = request.nextUrl.origin;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Successfully verified - redirect to intended destination
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Verification failed - redirect to error page
  return NextResponse.redirect(
    new URL("/error?message=Błąd weryfikacji. Link mógł wygasnąć.", origin)
  );
}
