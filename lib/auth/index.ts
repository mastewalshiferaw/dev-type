import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { profileStore, setUsername } from '@/lib/profile';
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
  const username =
    (user.user_metadata?.username as string | undefined) || user.email?.split('@')[0] || 'coder';

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

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error?: string; user?: AuthUser }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
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
    updateAuthState({ user: authUser });
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

  const cleanUsername = username?.trim() || email.split('@')[0];

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const authUser = formatSupabaseUser(data.user);
      if (!data.session) {
        return {
          user: authUser,
          needsConfirmation: true,
        };
      }
      guestStore.set({ user: null });
      updateAuthState({ user: authUser });
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
    `coder_${Math.random().toString(36).substring(2, 6)}`;

  const guestUser: AuthUser = {
    id: `guest_${Date.now()}`,
    email: `${username}@local.dev`,
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
  const clean = newUsername.trim();
  setUsername(clean);

  if (currentAuthState.user?.isGuest) {
    const updatedGuest: AuthUser = {
      ...currentAuthState.user,
      username: clean,
    };
    guestStore.set({ user: updatedGuest });
    updateAuthState({ user: updatedGuest });
    return {};
  }

  const supabase = getSupabase();
  if (supabase && currentAuthState.user) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { username: clean },
      });
      if (error) return { error: error.message };
      if (data.user) {
        updateAuthState({ user: formatSupabaseUser(data.user) });
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update username' };
    }
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

const getSnapshot = () => currentAuthState;
const getServerSnapshot = (): AuthState => ({
  user: null,
  isLoading: true,
  isConfigured: true,
});

/**
 * Hook to read auth state in React components using useSyncExternalStore.
 */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribeAuth, getSnapshot, getServerSnapshot);
}
