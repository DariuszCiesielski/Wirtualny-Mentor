/**
 * Admin / Whitelist Types
 *
 * Types for the user whitelist system (wm_allowed_users table).
 * Only users on the whitelist can access the platform.
 */

export type UserRole = "admin" | "user";

/**
 * Entry in the wm_allowed_users whitelist table
 */
export interface AllowedUser {
  id: string;
  email: string;
  user_id: string | null;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new user via admin panel
 */
export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  display_name?: string;
}

/**
 * Input for updating a user via admin panel
 */
export interface UpdateUserInput {
  role?: UserRole;
  display_name?: string;
}

/**
 * Result of checking user access against the whitelist
 */
export interface UserAccessResult {
  hasAccess: boolean;
  role: UserRole | null;
  allowedUserId: string | null;
}
