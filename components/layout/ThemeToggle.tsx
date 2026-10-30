'use client';

import { Moon, Sun } from 'lucide-react';
import { ICON_BUTTON } from '@/components/ui/Button';
import { useModKey } from '@/hooks/usePlatform';
import { toggleTheme } from '@/lib/theme';

const ICON = 'absolute transition-[transform,opacity] duration-(--duration-slow) ease-out';

/**
 * Icons are driven by `data-theme` in CSS, not React state, so the right one shows on the very
 * first paint and there is nothing to hydrate. They rotate and fade into each other.
 */
export default function ThemeToggle() {
  const mod = useModKey();
  return (
    <button
      type="button"
      onClick={(event) => {
        // The reveal grows from the button's centre (also for keyboard activation)
        const rect = event.currentTarget.getBoundingClientRect();
        toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      aria-label="Toggle light and dark theme"
      aria-keyshortcuts="Control+Shift+L Meta+Shift+L"
      title={`Toggle theme (${mod}+Shift+L)`}
      className={`${ICON_BUTTON} relative overflow-hidden hover:text-accent`}
    >
      <Sun
        size={18}
        aria-hidden
        className={`${ICON} scale-100 rotate-0 opacity-100 dark:scale-50 dark:-rotate-90 dark:opacity-0`}
      />
      <Moon
        size={18}
        aria-hidden
        className={`${ICON} scale-50 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100`}
      />
    </button>
  );
}
