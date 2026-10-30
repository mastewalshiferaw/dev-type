/**
 * Server-safe constants for the boot splash (components/splash/Splash.tsx).
 */

export const SPLASH_STORAGE_KEY = 'devtype:booted';

/**
 * Runs in <head> before the first paint. On the first visit to the home page in a browser session
 * it sets html[data-splash] ("full", or "reduced" for prefers-reduced-motion) and
 * html[data-splash-logo]; CSS then shows the overlay from the very first frame, with the right
 * theme already applied by the theme script. Storage errors (private mode, blocked storage)
 * simply mean no splash.
 */
export const SPLASH_INIT_SCRIPT = `(function(){try{if(location.pathname!=='/'||sessionStorage.getItem(${JSON.stringify(
  SPLASH_STORAGE_KEY
)}))return;sessionStorage.setItem(${JSON.stringify(
  SPLASH_STORAGE_KEY
)},'1');var h=document.documentElement;h.setAttribute('data-splash',matchMedia('(prefers-reduced-motion: reduce)').matches?'reduced':'full');h.setAttribute('data-splash-logo','')}catch(e){}})()`;
