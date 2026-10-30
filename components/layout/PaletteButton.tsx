'use client';

import { Command } from 'lucide-react';
import { ICON_BUTTON } from '@/components/ui/Button';
import Kbd from '@/components/ui/Kbd';
import { useModKey } from '@/hooks/usePlatform';

/** Opens the command palette: a labelled button with its shortcut, or an icon on small screens. */
export default function PaletteButton({ onClick }: { onClick: () => void }) {
  const mod = useModKey();
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-xs text-muted transition-ui select-none hover:border-line-hover hover:bg-raised/60 hover:text-ink active:translate-y-px active:bg-raised sm:inline-flex"
      >
        <Command size={14} aria-hidden />
        Commands
        <Kbd>{mod} K</Kbd>
      </button>
      <button
        type="button"
        onClick={onClick}
        aria-label="Open command palette"
        className={`${ICON_BUTTON} sm:hidden`}
      >
        <Command size={18} aria-hidden />
      </button>
    </>
  );
}
