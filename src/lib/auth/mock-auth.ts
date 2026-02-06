/**
 * Mock Auth for testing without Supabase
 *
 * Simulates authentication using localStorage.
 * Enable by setting NEXT_PUBLIC_MOCK_AUTH=true in .env.local
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

const STORAGE_KEY = "mock_auth_user";

// Check if mock auth is enabled
export function isMockAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
}

// Get current user from localStorage
export function getMockUser(): MockUser | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Sign up - creates a new mock user
export async function mockSignUp(email: string, password: string): Promise<{ user: MockUser | null; error: string | null }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple validation
  if (password.length < 8) {
    return { user: null, error: "Hasło musi mieć minimum 8 znaków" };
  }

  const user: MockUser = {
    id: crypto.randomUUID(),
    email,
    user_metadata: {
      full_name: email.split("@")[0],
    },
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return { user, error: null };
}

// Sign in - checks if user exists (in mock, any password works)
export async function mockSignIn(email: string, password: string): Promise<{ user: MockUser | null; error: string | null }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!email || !password) {
    return { user: null, error: "Email i hasło są wymagane" };
  }

  // In mock mode, create user if doesn't exist, or return existing
  let user = getMockUser();

  if (!user || user.email !== email) {
    user = {
      id: crypto.randomUUID(),
      email,
      user_metadata: {
        full_name: email.split("@")[0],
      },
    };
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return { user, error: null };
}

// Sign out
export async function mockSignOut(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  localStorage.removeItem(STORAGE_KEY);
}

// Update user profile
export async function mockUpdateUser(data: { full_name?: string; avatar_url?: string }): Promise<{ user: MockUser | null; error: string | null }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const user = getMockUser();
  if (!user) {
    return { user: null, error: "Nie zalogowano" };
  }

  user.user_metadata = {
    ...user.user_metadata,
    ...data,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

  return { user, error: null };
}

// For server-side: check cookie-based mock session
export function getMockUserFromCookie(cookieValue: string | undefined): MockUser | null {
  if (!cookieValue) return null;

  try {
    return JSON.parse(cookieValue);
  } catch {
    return null;
  }
}
