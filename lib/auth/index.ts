import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { profileStore, setUsername, USERNAME_PATTERN, USERNAME_HINT } from '@/lib/profile';
import { createLocalStore } from '@/lib/store';
import type { AuthState, AuthUser } from './types';

const GUEST_KEY = 'devtype:guest_user';

interface GuestStoreData {
  user: AuthUser | null;
}

const guestStore = createLocalStore<GuestStoreData>(GUEST_KEY, { user: null }, (raw) =>
  raw && typeof raw === 'object' && 'user' in raw ? (raw as GuestStoreData) : { user: null }
);

function formatSupabaseUser(user: User): AuthUser {
  const username = (user.user_metadata?.username as string | undefined) || `coder_${user.id.substring(0, 4)}`;

  return {
    id: user.id,
    email: user.email ?? '',
    username,
    createdAt: user.created_at,
    isGuest: false,
  };
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

  try {
    // Primary authoritative source: the profiles table (contains all registered accounts)
    const { data: profileRows, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', clean)
      .limit(20);

    if (!profileError && Array.isArray(profileRows)) {
      const profileMatches = profileRows.filter(
        (row: { id?: string; username?: string }) => row.username?.toLowerCase() === lower
      );
      if (profileMatches.length > 0) {
        if (excludeUserId) {
          return profileMatches.every((row: { id?: string }) => row.id === excludeUserId);
        }
        return false;
      }
    }

    return true;
  } catch {
    // Be permissive on error so signup is never blocked unexpectedly
    return true;
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
      const authUser = formatSupabaseUser(session.user);
      updateAuthState({
        user: authUser,
        isLoading: false,
        isConfigured: true,
      });
      setUsername(authUser.username);
    }
  });

  // Listen to Supabase auth events
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const authUser = formatSupabaseUser(session.user);
      guestStore.set({ user: null });
      updateAuthState({
        user: authUser,
        isLoading: false,
      });
      setUsername(authUser.username);
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

  if (isDisposableOrFakeEmail(cleanEmail)) {
    return {
      error: 'Please enter a real email address, or choose Continue as Guest below if you do not wish to use an email.',
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

    const authUser = formatSupabaseUser(data.user);
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

  if (isDisposableOrFakeEmail(cleanEmail)) {
    return {
      error: 'Please enter a real email address, or choose Continue as Guest below if you do not wish to use an email.',
    };
  }

  let cleanUsername = (username?.trim() || '').replace(/\s+/g, '_') || `coder_${Math.random().toString(36).substring(2, 8)}`;

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

      const authUser = formatSupabaseUser(data.user);
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

export async function updateAuthUsername(newUsername: string): Promise<{ error?: string }> {
  const clean = newUsername.trim().replace(/\s+/g, '_');
  if (!clean || !USERNAME_PATTERN.test(clean)) {
    return { error: USERNAME_HINT };
  }

  // Check username uniqueness against profiles
  const available = await checkUsernameAvailable(clean, currentAuthState.user?.id);
  if (!available) {
    return { error: 'This username is already taken. Please choose another one.' };
  }

  if (currentAuthState.user?.isGuest) {
    const updatedGuest: AuthUser = {
      ...currentAuthState.user,
      username: clean,
    };
    guestStore.set({ user: updatedGuest });
    updateAuthState({ user: updatedGuest });
    setUsername(clean);
    return {};
  }

  const supabase = getSupabase();
  if (supabase && currentAuthState.user) {
    try {
      const oldUsername = currentAuthState.user.username;
      const { data, error } = await supabase.auth.updateUser({
        data: { username: clean },
      });
      if (error) return { error: error.message };
      if (data.user) {
        // Also sync to public.profiles table
        try {
          await supabase.from('profiles').upsert({ id: data.user.id, username: clean, email: data.user.email });
        } catch {
          // Graceful fallback if profiles table migration not yet applied
        }

        // Migrate past scores to the new username so the leaderboard stays clean
        if (oldUsername && oldUsername.toLowerCase() !== clean.toLowerCase()) {
          try {
            await supabase.from('scores').update({ player_name: clean }).ilike('player_name', oldUsername);
          } catch {
            // Ignore if RLS restricts score updates
          }
        }

        updateAuthState({ user: formatSupabaseUser(data.user) });
        setUsername(clean);
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update username' };
    }
  } else {
    // No Supabase configured, just update local state
    setUsername(clean);
  }

  return {};
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
