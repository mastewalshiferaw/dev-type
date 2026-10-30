'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { CommandGroup, CommandItem } from '@/components/ui/CommandDialog';
import { setTheme, THEME_OPTIONS, useThemePreference, type ThemePreference } from '@/lib/theme';

const THEME_ICONS: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

/** Theme: Light / Dark / System. `run` wraps each action (e.g. to close the palette first). */
export default function ThemeCommands({ run }: { run: (action: () => void) => () => void }) {
  const theme = useThemePreference();
  return (
    <CommandGroup heading="Theme">
      {THEME_OPTIONS.map((value) => (
        <CommandItem
          key={value}
          icon={THEME_ICONS[value]}
          active={theme === value}
          keywords={['theme', 'mode', 'color']}
          onSelect={run(() => setTheme(value))}
        >
          Theme: {value[0].toUpperCase() + value.slice(1)}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
