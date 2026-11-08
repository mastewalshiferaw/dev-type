import { createLocalStore, useLocalStore } from '@/lib/store';

export interface Profile {
  username: string;
  avatarUrl?: string;
  telegram?: string;
}

export const USERNAME_PATTERN = /^[\w.@-]{2,18}$/;
export const USERNAME_HINT = '2–18 characters: letters, numbers, _, -, . (spaces become _)';

export const AVATAR_PRESETS = [
  { id: 'dev-1', label: 'Matrix Hacker', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop&q=80' },
  { id: 'dev-2', label: 'Cyberpunk Coder', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80' },
  { id: 'dev-3', label: 'Minimalist Terminal', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=150&auto=format&fit=crop&q=80' },
  { id: 'dev-4', label: 'Retro Neon', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80' },
  { id: 'dev-5', label: 'AI Engineer', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
  { id: 'dev-6', label: 'Vibecoder', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=150&auto=format&fit=crop&q=80' },
];

export const profileStore = createLocalStore<Profile>('devtype:profile', { username: '', avatarUrl: '', telegram: '' }, (raw) => {
  const p = raw as Profile | null;
  const username = typeof p?.username === 'string' && USERNAME_PATTERN.test(p.username) ? p.username : '';
  const avatarUrl = typeof p?.avatarUrl === 'string' ? p.avatarUrl : '';
  const telegram = typeof p?.telegram === 'string' ? p.telegram : '';
  return { username, avatarUrl, telegram };
});

export function useProfile(): Profile {
  return useLocalStore(profileStore);
}

export function setUsername(username: string) {
  const clean = username.trim().replace(/\s+/g, '_');
  profileStore.set({ ...profileStore.get(), username: clean });
}

export function setProfileData(partial: Partial<Profile>) {
  profileStore.set({ ...profileStore.get(), ...partial });
}
