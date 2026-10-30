import { createLocalStore, useLocalStore } from '@/lib/store';
import { DARK_QUERY, THEME_STORAGE_KEY } from '@/lib/theme-script';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_OPTIONS: readonly ThemePreference[] = ['light', 'dark', 'system'];

export const themeStore = createLocalStore<ThemePreference>(THEME_STORAGE_KEY, 'system', (raw) =>
  THEME_OPTIONS.includes(raw as ThemePreference) ? (raw as ThemePreference) : 'system'
);

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/** Swap `data-theme` with transitions suspended for a frame, so colors change in one step. */
export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const next = resolveTheme(preference);
  if (root.dataset.theme === next) return;
  root.setAttribute('data-theme-switching', '');
  root.dataset.theme = next;
  requestAnimationFrame(() => requestAnimationFrame(() => root.removeAttribute('data-theme-switching')));
}

/** Keep <html data-theme> in sync with the stored preference and the OS setting. */
export function syncTheme(): () => void {
  const media = window.matchMedia(DARK_QUERY);
  const update = () => applyTheme(themeStore.get());
  update();
  media.addEventListener('change', update);
  const unsubscribe = themeStore.subscribe(update);
  return () => {
    media.removeEventListener('change', update);
    unsubscribe();
  };
}

export function setTheme(preference: ThemePreference) {
  themeStore.set(preference);
}

/** Flip between light and dark based on what is currently on screen. */
export function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

export function useThemePreference(): ThemePreference {
  return useLocalStore(themeStore);
}
