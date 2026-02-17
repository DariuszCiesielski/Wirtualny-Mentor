/**
 * Get the base URL of the application.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL (explicitly set, e.g. on Vercel)
 * 2. VERCEL_URL (auto-set by Vercel on every deploy, no protocol)
 * 3. localhost:3000 (dev fallback)
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
