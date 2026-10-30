'use client';

import Kbd from '@/components/ui/Kbd';
import { useModKey } from '@/hooks/usePlatform';

export default function Footer() {
  const mod = useModKey();
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted">
      <span>
        <Kbd>Tab</Kbd> restart
      </span>
      <span>
        <Kbd>⇧ Enter</Kbd> finish zen
      </span>
      <span>
        <Kbd>{mod} K</Kbd> commands
      </span>
      <span>
        <Kbd>{mod} ⇧ L</Kbd> theme
      </span>
    </footer>
  );
}
