/**
 * Server-safe theme constants (no React imports), shared by the layout and `lib/theme.ts`.
 */

export const THEME_STORAGE_KEY = 'devtype:theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Kept dependency-free and in sync with `resolveTheme` in lib/theme.ts.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)}));var d=p==='dark'||(p!=='light'&&matchMedia(${JSON.stringify(
  DARK_QUERY
)}).matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='dark'}})()`;
