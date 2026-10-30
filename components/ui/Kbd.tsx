import type { ReactNode } from 'react';

export default function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line-strong bg-surface px-1 text-2xs leading-none text-muted">
      {children}
    </kbd>
  );
}
