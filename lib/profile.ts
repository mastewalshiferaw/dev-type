import { createLocalStore, useLocalStore } from '@/lib/store';

export interface Profile {
  username: string;
}

export const USERNAME_PATTERN = /^[\w.@-]{2,18}$/;
export const USERNAME_HINT = '2–18 characters: letters, numbers, _ . - @';

export const profileStore = createLocalStore<Profile>('devtype:profile', { username: '' }, (raw) => {
  const username = (raw as Profile | null)?.username;
  return { username: typeof username === 'string' && USERNAME_PATTERN.test(username) ? username : '' };
});

export function useProfile(): Profile {
  return useLocalStore(profileStore);
}

export function setUsername(username: string) {
  profileStore.set({ username: username.trim() });
}
