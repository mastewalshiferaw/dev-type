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

const THEME_FADE_MS = 200;
const REVEAL_MS = 560;
let switchTimer = 0;
/** True while a View Transition captures the new theme: the crossfade would leak into the snapshot */
let instantSwitch = false;

/** Swap `data-theme` with a short crossfade (see [data-theme-switching] in app/globals.css). */
export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement;
  const next = resolveTheme(preference);
  if (root.dataset.theme === next) return;
  if (instantSwitch) {
    root.dataset.theme = next;
    return;
  }
  root.setAttribute('data-theme-switching', '');
  root.dataset.theme = next;
  window.clearTimeout(switchTimer);
  switchTimer = window.setTimeout(() => root.removeAttribute('data-theme-switching'), THEME_FADE_MS);
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

/**
 * Flip between light and dark based on what is currently on screen. Where the View Transitions
 * API exists (and motion is welcome), the new theme grows as a circle from `origin` (the toggle
 * button) over the old one; elsewhere it is the regular 150ms crossfade.
 */
export function toggleTheme(origin?: { x: number; y: number }) {
  const next: ResolvedTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  const canReveal =
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canReveal) {
    setTheme(next);
    return;
  }

  // Keyboard shortcut: grow from the top-right corner, where the toggle lives
  const x = typeof origin?.x === 'number' ? origin.x : window.innerWidth - 32;
  const y = typeof origin?.y === 'number' ? origin.y : 32;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => {
    instantSwitch = true;
    setTheme(next);
    applyTheme(next);
    instantSwitch = false;
  });
  transition.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: REVEAL_MS,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    )
    .catch(() => {});
}

export function useThemePreference(): ThemePreference {
  return useLocalStore(themeStore);
}
