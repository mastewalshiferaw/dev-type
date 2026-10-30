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

// -700 shades keep white initials above the 4.5:1 AA contrast ratio
const AVATAR_COLORS = ['bg-emerald-700', 'bg-cyan-700', 'bg-violet-700', 'bg-amber-700', 'bg-rose-700'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.replace(/^@/, '').slice(0, 2).toUpperCase() || '?';
}
