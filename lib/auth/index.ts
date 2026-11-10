import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { profileStore, setUsername, setProfileData, USERNAME_PATTERN, USERNAME_HINT } from '@/lib/profile';
import { createLocalStore, useLocalStore } from '@/lib/store';
import { refreshLeaderboard } from '@/hooks/useLeaderboard';
import type { AuthState, AuthUser } from './types';

export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'update_password';

export interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
}

export const authModalStore = createLocalStore<AuthModalState>(
  'devtype:auth_modal',
  { open: false, mode: 'signin' },
  (raw) => {
    if (raw && typeof raw === 'object' && 'open' in raw && 'mode' in raw) {
      return raw as AuthModalState;
    }
    return { open: false, mode: 'signin' };
  }
);

export function useAuthModal(): AuthModalState {
  return useLocalStore(authModalStore);
}

export function openAuthModal(mode: AuthModalMode = 'signin') {
  authModalStore.set({ open: true, mode });
}

export function closeAuthModal() {
  authModalStore.set({ open: false, mode: 'signin' });
}

const GUEST_KEY = 'devtype:guest_user';

interface GuestStoreData {
  user: AuthUser | null;
}

const guestStore = createLocalStore<GuestStoreData>(GUEST_KEY, { user: null }, (raw) =>
  raw && typeof raw === 'object' && 'user' in raw ? (raw as GuestStoreData) : { user: null }
);

export interface ProfileData {
  username?: string;
  avatarUrl?: string;
  telegram?: string;
}

export function formatSupabaseUser(user: User, profileData?: ProfileData): AuthUser {
  const username = profileData?.username || (user.user_metadata?.username as string | undefined) || `coder_${user.id.substring(0, 4)}`;

  return {
    id: user.id,
    email: user.email ?? '',
    username,
    avatarUrl: profileData?.avatarUrl || (user.user_metadata?.avatar_url as string | undefined) || undefined,
    telegram: profileData?.telegram || (user.user_metadata?.telegram as string | undefined) || undefined,
    telegramVerified: Boolean(user.user_metadata?.telegram_verified),
    createdAt: user.created_at,
    isGuest: false,
  };
}

export async function fetchProfileData(userId: string): Promise<ProfileData | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, telegram')
      .eq('id', userId)
      .maybeSingle();
    return {
      username: data?.username || undefined,
      avatarUrl: data?.avatar_url || undefined,
      telegram: data?.telegram || undefined,
    };
  } catch {
    return null;
  }
}

export async function syncAuthUser(user: User): Promise<AuthUser> {
  const profileData = await fetchProfileData(user.id);
  return formatSupabaseUser(user, profileData || undefined);
}

let authListeners: Array<() => void> = [];
let currentAuthState: AuthState = {
  user: null,
  isLoading: true,
  isConfigured: true,
};

function emitAuthChange() {
  authListeners.forEach((listener) => listener());
}

function updateAuthState(partial: Partial<AuthState>) {
  currentAuthState = { ...currentAuthState, ...partial };
  emitAuthChange();
}

/**
 * Checks whether a username is available by querying existing scores and testimonials.
 * Uses the scores table's `player_name` column (public read via RLS) as the primary
 * source of taken usernames, plus the testimonials table as a secondary check.
 *
 * Case-insensitive: "RustAce" and "rustace" are considered the same name.
 * ilike may over-match due to the _ wildcard, so rows are fetched and compared precisely.
 *
 * Returns true when Supabase is not configured so signup is never blocked by a missing backend.
 */
export async function checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return true;

  const clean = username.trim().replace(/\s+/g, '_');
  if (!clean || !USERNAME_PATTERN.test(clean)) return false;

  const lower = clean.toLowerCase();
  const isUuid = excludeUserId
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludeUserId)
    : false;
  const validExcludeId = isUuid ? excludeUserId : null;

  try {
    // 0. Primary authoritative check via PostgreSQL RPC function
    try {
      const { data: rpcAvailable, error: rpcError } = await supabase.rpc('check_username_available', {
        candidate_username: clean,
        exclude_user_id: validExcludeId,
      });
      if (!rpcError && typeof rpcAvailable === 'boolean') {
        return rpcAvailable;
      }
    } catch {
      // Fall through to direct table checks if RPC is not yet installed
    }

    // 1. Check profiles table for identical or similar names (case-insensitive exact match)
    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', clean)
      .limit(25);

    if (!profileError && Array.isArray(profileRows)) {
      const profileMatches = profileRows.filter(
        (row: { id?: string; username?: string }) => row.username?.trim().toLowerCase() === lower
      );
      if (profileMatches.length > 0) {
        if (validExcludeId) {
          const isOwn = profileMatches.every((row: { id?: string }) => row.id === validExcludeId);
          if (!isOwn) return false;
        } else {
          return false;
        }
      }
    }

    // 2. Check scores table for identical names (even from guest runs or older records)
    let scoreRows: Array<{ id?: string | number; user_id?: string | null; player_name?: string }> | null = null;
    const { data: scoresWithUser, error: scoreErr } = await supabase
      .from('scores')
      .select('id, user_id, player_name')
      .ilike('player_name', clean)
      .limit(25);

    if (!scoreErr && Array.isArray(scoresWithUser)) {
      scoreRows = scoresWithUser;
    } else {
      // Fallback if user_id column is not in PostgREST cache
      const { data: scoresSimple } = await supabase
        .from('scores')
        .select('id, player_name')
        .ilike('player_name', clean)
        .limit(25);
      if (Array.isArray(scoresSimple)) {
        scoreRows = scoresSimple;
      }
    }

    if (Array.isArray(scoreRows)) {
      const scoreMatches = scoreRows.filter(
        (row) => row.player_name?.trim().toLowerCase() === lower
      );
      if (scoreMatches.length > 0) {
        if (validExcludeId) {
          const isOwn = scoreMatches.every(
            (row) => row.user_id && row.user_id === validExcludeId
          );
          if (!isOwn) return false;
        } else {
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    console.error('checkUsernameAvailable error:', err);
    // Fail closed to prevent accidental collisions if query fails
    return false;
  }
}

/**
 * Finds a unique variant of a base username by appending a short random suffix.
 * Used for auto-generated names that collide.
 */
async function generateUniqueUsername(base: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).substring(2, 5);
    const candidate = `${base.slice(0, 14)}_${suffix}`.slice(0, 18);
    if (await checkUsernameAvailable(candidate)) return candidate;
  }
  return `${base.slice(0, 14)}_${Date.now().toString(36).slice(-3)}`.slice(0, 18);
}

let initialized = false;

export function initAuth() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const supabase = getSupabase();
  if (!supabase) {
    const guest = guestStore.get().user;
    updateAuthState({
      user: guest,
      isLoading: false,
      isConfigured: false,
    });
    if (guest?.username) {
      setUsername(guest.username);
    }
    return;
  }

  // Check active Supabase session
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error || !session?.user) {
      const guest = guestStore.get().user;
      updateAuthState({
        user: guest,
        isLoading: false,
        isConfigured: true,
      });
      if (guest?.username) {
        setUsername(guest.username);
      }
    } else {
      syncAuthUser(session.user).then((authUser) => {
        updateAuthState({
          user: authUser,
          isLoading: false,
          isConfigured: true,
        });
        setUsername(authUser.username);
      });
    }
  });

  // Check URL parameters for password recovery link
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const searchParams = new URLSearchParams(search);
    const hasRecovery =
      hash.includes('type=recovery') ||
      search.includes('recovery=true') ||
      searchParams.has('code') ||
      searchParams.has('token_hash');

    if (hasRecovery) {
      resolveRecoverySession().finally(() => {
        openAuthModal('update_password');
      });
    }
  }

  // Listen to Supabase auth events
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      openAuthModal('update_password');
    }
    if (session?.user) {
      syncAuthUser(session.user).then((authUser) => {
        guestStore.set({ user: null });
        updateAuthState({
          user: authUser,
          isLoading: false,
        });
        setUsername(authUser.username);
      });
    } else {
      const guest = guestStore.get().user;
      updateAuthState({
        user: guest,
        isLoading: false,
      });
      if (guest?.username) {
        setUsername(guest.username);
      }
    }
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BLOCKED_OR_FAKE_DOMAINS = new Set([
  'email.com',
  'test.com',
  'fake.com',
  'example.com',
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'dispostable.com',
  'sharklasers.com',
  'yopmail.com',
]);

export function isDisposableOrFakeEmail(email: string): boolean {
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].trim();
  return BLOCKED_OR_FAKE_DOMAINS.has(domain);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error?: string; user?: AuthUser }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase is not configured' };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { error: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 72) {
    return { error: 'Password cannot exceed 72 characters' };
  }

  if (isDisposableOrFakeEmail(cleanEmail)) {
    return {
      error:
        'Please enter a real email address, or choose Continue as Guest below if you do not wish to use an email.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'No user returned from login' };
    }

    const authUser = await syncAuthUser(data.user);
    guestStore.set({ user: null });
    updateAuthState({ user: authUser, isLoading: false });
    setUsername(authUser.username);
    return { user: authUser };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Sign in failed' };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username?: string
): Promise<{ error?: string; user?: AuthUser; needsConfirmation?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase is not configured' };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { error: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 72) {
    return { error: 'Password cannot exceed 72 characters' };
  }

  if (isDisposableOrFakeEmail(cleanEmail)) {
    return {
      error:
        'Please enter a real email address, or choose Continue as Guest below if you do not wish to use an email.',
    };
  }

  let cleanUsername =
    (username?.trim() || '').replace(/\s+/g, '_') || `coder_${Math.random().toString(36).substring(2, 8)}`;

  // Enforce username uniqueness — check against profiles
  const available = await checkUsernameAvailable(cleanUsername);
  if (!available) {
    if (username?.trim()) {
      return { error: 'This username is already taken. Please choose another one.' };
    }
    cleanUsername = await generateUniqueUsername(cleanUsername);
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('profiles_username_lower_idx') ||
        msg.includes('unique constraint') ||
        msg.includes('duplicate key') ||
        msg.includes('username is already taken')
      ) {
        return { error: 'This username is already taken. Please choose another one.' };
      }
      if (
        msg.includes('already registered') ||
        msg.includes('already in use') ||
        msg.includes('already exists') ||
        msg.includes('user already exists')
      ) {
        return { error: 'An account with this email address already exists. Please sign in instead.' };
      }
      return { error: error.message };
    }

    if (data.user) {
      // In Supabase, if email is already taken and anti-enumeration/confirmation is enabled,
      // data.user is returned with an empty identities array: data.user.identities = []
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { error: 'An account with this email address already exists. Please sign in instead.' };
      }

      const authUser = await syncAuthUser(data.user);
      if (!data.session) {
        return {
          user: authUser,
          needsConfirmation: true,
        };
      }
      guestStore.set({ user: null });
      updateAuthState({ user: authUser, isLoading: false });
      setUsername(authUser.username);
      return { user: authUser };
    }

    return { error: 'Could not create account' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Sign up failed' };
  }
}

/**
 * Resolves a password recovery link session from URL params (PKCE code, token_hash, or hash tokens).
 * Ensures an active session exists before the user is asked to enter a new password.
 */
export async function resolveRecoverySession(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Window not available' };
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase is not configured' };

  // 1. Check if we already have an active valid session
  const { data: initialData } = await supabase.auth.getSession();
  if (initialData?.session?.user) {
    return { success: true };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
  if (errorDesc) {
    return { success: false, error: decodeURIComponent(errorDesc).replace(/\+/g, ' ') };
  }

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || hashParams.get('type');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  // 2. PKCE authorization code exchange
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // detectSessionInUrl may have already completed the exchange in parallel
        const { data: fallbackData } = await supabase.auth.getSession();
        if (fallbackData?.session?.user) {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('code');
          cleanUrl.searchParams.delete('recovery');
          window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      if (data.session) {
        // Clean URL to prevent re-using code on refresh
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('recovery');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
        return { success: true };
      }
    } catch (err) {
      const { data: fallbackData } = await supabase.auth.getSession();
      if (fallbackData?.session?.user) {
        return { success: true };
      }
      return { success: false, error: err instanceof Error ? err.message : 'Failed to verify recovery code' };
    }
  }

  // 3. Verify OTP token_hash
  if (tokenHash && (type === 'recovery' || !type)) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.session) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token_hash');
        cleanUrl.searchParams.delete('type');
        cleanUrl.searchParams.delete('recovery');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to verify recovery token' };
    }
  }

  // 4. Set session from hash access_token
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.session) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to initialize session' };
    }
  }

  // 5. Final check after any asynchronous detection
  const { data: finalData } = await supabase.auth.getSession();
  if (finalData?.session?.user) {
    return { success: true };
  }

  return {
    success: false,
    error: 'Your password reset link is invalid or has expired. Please request a new recovery link.',
  };
}

export async function requestPasswordReset(
  email: string
): Promise<{ error?: string; success?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
    return { error: 'Please enter a valid email address' };
  }

  // 1. Try server-side endpoint first for robust delivery & rate-limit handling
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      return { success: true };
    }

    if (data?.error) {
      return { error: data.error };
    }
  } catch {
    // If API route is unreachable, fall back to direct Supabase client call
  }

  // 2. Client-side fallback
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase is not configured' };
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectTo = `${origin}/play?recovery=true`;
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (error) {
      if (error.message.includes('Error sending recovery email')) {
        return {
          error:
            'Email service rate limit reached or delivery temporarily unavailable. Please wait a few minutes before trying again.',
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to send password reset email' };
  }
}

export async function updateUserPassword(
  newPassword: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase is not configured' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  if (newPassword.length > 72) {
    return { error: 'Password cannot exceed 72 characters' };
  }

  // Make sure a session exists before attempting updateUser
  const recoverySession = await resolveRecoverySession();
  if (!recoverySession.success) {
    return {
      error: recoverySession.error || 'Your recovery session has expired. Please request a new recovery link.',
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes('Auth session missing')) {
        return {
          error: 'Your password reset link has expired or was already used. Please request a new recovery link.',
        };
      }
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to update password' };
  }
}

export function signInAsGuest(customUsername?: string): AuthUser {
  const currentProfile = profileStore.get();
  const username =
    customUsername?.trim() ||
    currentProfile.username ||
    `guest_${Math.random().toString(36).substring(2, 6)}`;

  const guestId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const guestUser: AuthUser = {
    id: `guest_${guestId}`,
    email: '',
    username,
    createdAt: new Date().toISOString(),
    isGuest: true,
  };

  guestStore.set({ user: guestUser });
  updateAuthState({ user: guestUser, isLoading: false });
  setUsername(username);
  return guestUser;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {});
  }
  guestStore.set({ user: null });
  updateAuthState({ user: null, isLoading: false });
}

export async function updateUserProfile(updates: {
  username?: string;
  avatarUrl?: string;
  telegram?: string;
}): Promise<{ error?: string }> {
  const cleanUsername = updates.username ? updates.username.trim().replace(/\s+/g, '_') : undefined;
  const cleanAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl.trim() : undefined;
  const cleanTelegram = updates.telegram !== undefined ? updates.telegram.trim().replace(/^@/, '') : undefined;

  // Check username if changing
  if (cleanUsername) {
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      return { error: USERNAME_HINT };
    }
    const currentName = currentAuthState.user?.username?.toLowerCase();
    if (cleanUsername.toLowerCase() !== currentName) {
      const available = await checkUsernameAvailable(cleanUsername, currentAuthState.user?.id);
      if (!available) {
        return { error: 'This username is already taken. Please choose another one.' };
      }
    }
  }

  // Update local profile store
  setProfileData({
    ...(cleanUsername ? { username: cleanUsername } : {}),
    ...(cleanAvatar !== undefined ? { avatarUrl: cleanAvatar } : {}),
    ...(cleanTelegram !== undefined ? { telegram: cleanTelegram } : {}),
  });

  if (currentAuthState.user?.isGuest) {
    const updatedGuest: AuthUser = {
      ...currentAuthState.user,
      ...(cleanUsername ? { username: cleanUsername } : {}),
      ...(cleanAvatar !== undefined ? { avatarUrl: cleanAvatar } : {}),
      ...(cleanTelegram !== undefined ? { telegram: cleanTelegram } : {}),
    };
    guestStore.set({ user: updatedGuest });
    updateAuthState({ user: updatedGuest });
    refreshLeaderboard();
    return {};
  }

  const supabase = getSupabase();
  if (supabase && currentAuthState.user) {
    try {
      const userId = currentAuthState.user.id;
      const effectiveUsername = cleanUsername || currentAuthState.user.username;

      // Update Supabase Auth metadata
      await supabase.auth.updateUser({
        data: {
          username: effectiveUsername,
          ...(cleanAvatar !== undefined ? { avatar_url: cleanAvatar } : {}),
          ...(cleanTelegram !== undefined ? { telegram: cleanTelegram } : {}),
        },
      });

      // Upsert public.profiles
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        username: effectiveUsername,
        avatar_url: cleanAvatar,
        telegram: cleanTelegram,
      });

      if (profileError) {
        console.error('Error updating profiles:', profileError.message);
      }

      // Update public.scores
      await supabase
        .from('scores')
        .update({
          player_name: effectiveUsername,
          avatar_url: cleanAvatar,
          telegram: cleanTelegram,
        })
        .eq('user_id', userId);

      updateAuthState({
        user: {
          ...currentAuthState.user,
          username: effectiveUsername,
          avatarUrl: cleanAvatar,
          telegram: cleanTelegram,
        },
      });
      refreshLeaderboard();
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  } else {
    refreshLeaderboard();
  }

  return {};
}

export async function updateAuthUsername(newUsername: string): Promise<{ error?: string }> {
  return updateUserProfile({ username: newUsername });
}

const subscribeAuth = (listener: () => void) => {
  initAuth();
  authListeners.push(listener);
  return () => {
    authListeners = authListeners.filter((l) => l !== listener);
  };
};

// Cached static constant (keeps reference identical on every call)
const SERVER_SNAPSHOT: AuthState = {
  user: null,
  isLoading: true,
  isConfigured: true,
};

const getSnapshot = () => currentAuthState;
const getServerSnapshot = () => SERVER_SNAPSHOT;

/**
 * Hook to read auth state in React components using useSyncExternalStore.
 */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeAuth, getSnapshot, getServerSnapshot);
}
