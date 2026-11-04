import type { AuthUser } from './types';

/**
 * Checks whether a given user has administrative privileges.
 *
 * Configured via:
 * - NEXT_PUBLIC_ADMIN_EMAILS (comma-separated list of emails, e.g. "admin@example.com,dev@site.org")
 * - ADMIN_EMAILS (server-side environment variable)
 *
 * In local development, if no admin emails are configured, any authenticated non-guest user
 * is treated as an admin so local development is frictionless.
 */
export function isUserAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || user.isGuest || !user.email) {
    return false;
  }

  const configured = (
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAILS ||
    ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured.includes(user.email.toLowerCase());
  }

  // Frictionless dev-mode fallback: allow testing when no admin email is explicitly locked down
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}
