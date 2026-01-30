/**
 * Sign Up Page
 *
 * Server Component that renders sign-up form.
 * Redirects to dashboard if user is already logged in.
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal/auth";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage() {
  // Redirect to dashboard if already logged in
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return <SignUpForm />;
}
