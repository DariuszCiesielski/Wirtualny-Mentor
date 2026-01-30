/**
 * Login Page
 *
 * Server Component that handles searchParams and renders login form.
 */

import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message = params.message;

  return <LoginForm message={message} />;
}
