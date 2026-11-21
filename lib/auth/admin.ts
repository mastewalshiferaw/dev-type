import type { AuthUser } from './types';

/**
 * Checks whether a given user has administrative privileges.
 *
 * Requirements:
 * 1. Must have an authenticated, non-guest user.
 * 2. Must have a confirmed email address (emailConfirmedAt != null).
 * 3. Role/privilege must come from app_metadata ONLY (user_metadata is client-writable and forbidden).
 * 4. Or server-side configured ADMIN_EMAILS environment variable.
 * 5. Strict fail-closed: NO dev-mode bypass.
 */
export function isUserAdmin(user: AuthUser | null | undefined): boolean {
  if (!user || user.isGuest || !user.email) {
    return false;
  }

  // Email confirmation gate: unverified email accounts cannot be admin
  if (!user.emailConfirmedAt) {
    return false;
  }

  // 1. Authorize via app_metadata (set by Supabase service role only)
  if (user.isAdmin || user.role === 'admin') {
    return true;
  }

  // 2. Authorize via server-side ADMIN_EMAILS environment variable
  const serverAdminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (serverAdminEmails.length > 0 && serverAdminEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  return false;
}
