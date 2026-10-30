'use client';

import { Moon, Sun } from 'lucide-react';
import { useModKey } from '@/hooks/usePlatform';
import { toggleTheme } from '@/lib/theme';

/**
 * Icons are driven by `data-theme` in CSS, not React state, so the right one shows on the very
 * first paint and there is nothing to hydrate.
 */
export default function ThemeToggle() {
  const mod = useModKey();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light and dark theme"
      aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
      title={`Toggle theme (${mod}+Shift+L)`}
      className="relative flex size-9 items-center justify-center overflow-hidden rounded-md text-muted transition-ui hover:bg-raised hover:text-accent"
    >
      <Sun
        size={18}
        aria-hidden
        className="absolute scale-100 rotate-0 opacity-100 transition-all duration-300 ease-out dark:scale-50 dark:-rotate-90 dark:opacity-0"
      />
      <Moon
        size={18}
        aria-hidden
        className="absolute scale-50 rotate-90 opacity-0 transition-all duration-300 ease-out dark:scale-100 dark:rotate-0 dark:opacity-100"
      />
    </button>
  );
}
