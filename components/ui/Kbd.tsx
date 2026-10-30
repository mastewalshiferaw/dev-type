import type { ReactNode } from 'react';

export default function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded-sm border border-line-strong px-1.5 py-px text-2xs text-muted">
      {children}
    </kbd>
  );
}
