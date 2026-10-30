'use client';

import { Command, Settings2, Terminal } from 'lucide-react';
import Link from 'next/link';
import ProfilePopover from '@/components/layout/ProfilePopover';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useModKey } from '@/hooks/usePlatform';

interface Props {
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  profileOpen: boolean;
  onProfileOpenChange: (open: boolean) => void;
}

const ICON_BUTTON =
  'transition-ui flex size-9 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink';

export default function Header({ onOpenPalette, onOpenSettings, profileOpen, onProfileOpenChange }: Props) {
  const mod = useModKey();
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-sm text-sm font-bold tracking-wider text-ink-dim"
      >
        <Terminal className="text-accent" size={20} aria-hidden />
        DEV_TYPE
      </Link>
      <nav aria-label="App" className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-keyshortcuts="Control+K Meta+K"
          className="hidden h-9 items-center gap-2 rounded-md border border-line px-3 text-xs text-muted transition-ui hover:border-line-strong hover:text-ink sm:flex"
        >
          <Command size={14} aria-hidden />
          Commands
          <kbd className="text-2xs">{mod} K</kbd>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className={`${ICON_BUTTON} sm:hidden`}
        >
          <Command size={18} aria-hidden />
        </button>
        <button type="button" onClick={onOpenSettings} aria-label="Open settings" className={ICON_BUTTON}>
          <Settings2 size={18} aria-hidden />
        </button>
        <ThemeToggle />
        <ProfilePopover open={profileOpen} onOpenChange={onProfileOpenChange} />
      </nav>
    </header>
  );
}
