/**
 * Login Page
 *
 * Server Component that handles searchParams and renders login form.
 * Redirects to dashboard if user is already logged in.
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal/auth";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Redirect to dashboard if already logged in
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message = params.message;

  return <LoginForm message={message} />;
}
