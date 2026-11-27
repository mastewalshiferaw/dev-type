'use client';

import Link from 'next/link';
import { Settings2, Swords } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import PaletteButton from '@/components/layout/PaletteButton';
import ProfilePopover from '@/components/layout/ProfilePopover';
import StreakBadge from '@/components/streak/StreakBadge';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface Props {
  onOpenPalette: () => void;
  onOpenSettings: () => void;
  profileOpen: boolean;
  onProfileOpenChange: (open: boolean) => void;
}

const ICON_BUTTON =
  'transition-ui flex size-9 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink';

export default function Header({ onOpenPalette, onOpenSettings, profileOpen, onProfileOpenChange }: Props) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Logo />
      <nav aria-label="App" className="flex items-center gap-2">
        <Link
          href="/duel"
          aria-label="1v1 Commit Duel"
          title="1v1 Commit Duel: Play with a friend"
          className={ICON_BUTTON}
        >
          <Swords size={18} aria-hidden />
        </Link>
        <StreakBadge />
        <PaletteButton onClick={onOpenPalette} />
        <button type="button" onClick={onOpenSettings} aria-label="Open settings" className={ICON_BUTTON}>
          <Settings2 size={18} aria-hidden />
        </button>
        <ThemeToggle />
        <ProfilePopover open={profileOpen} onOpenChange={onProfileOpenChange} />
      </nav>
    </header>
  );
}
