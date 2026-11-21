import { createClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isUserAdmin } from './admin';
import { formatSupabaseUser } from './format';
import type { AuthUser } from './types';

function getAnonAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Extracts the user token from Authorization header or cookie.
 */
export async function getTokenFromRequest(request?: Request): Promise<string | null> {
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) return token;
    }
  }

  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('sb-access-token');
    if (tokenCookie?.value) {
      return tokenCookie.value;
    }
  } catch {
    // cookies() may throw outside Next.js request context
  }

  return null;
}

/**
 * Validates session and returns authenticated Supabase User object, or null.
 */
export async function getUserFromToken(token: string | null): Promise<User | null> {
  if (!token) return null;
  const client = getAnonAuthClient();
  if (!client) return null;

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Enforces authenticated user on an API route.
 * Returns { user, token } or error response.
 */
export async function requireUser(
  request: Request
): Promise<{ user: User; authUser: AuthUser; token: string } | { error: string; status: number }> {
  const token = await getTokenFromRequest(request);
  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return { error: 'Invalid or expired session', status: 401 };
  }

  const authUser = formatSupabaseUser(user);
  return { user, authUser, token };
}

/**
 * Enforces administrator privilege on an API route.
 * Returns 404 (not 401/403) for unauthorized requests to prevent route disclosure.
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User; authUser: AuthUser; token: string } | { error: string; status: number }> {
  const auth = await requireUser(request);
  if ('error' in auth) {
    return { error: 'Not found', status: 404 };
  }

  if (!isUserAdmin(auth.authUser)) {
    return { error: 'Not found', status: 404 };
  }

  return auth;
}

/**
 * Server Component helper for admin verification via cookies.
 * Returns AuthUser if admin, null otherwise.
 */
export async function getServerAdminUser(): Promise<AuthUser | null> {
  const token = await getTokenFromRequest();
  if (!token) return null;

  const user = await getUserFromToken(token);
  if (!user) return null;

  const authUser = formatSupabaseUser(user);
  if (!isUserAdmin(authUser)) return null;

  return authUser;
}
