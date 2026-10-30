'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Check, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Predictable matching: every search word must appear in the label (score 2) or the keywords
 * (score 1). cmdk's default fuzzy scorer ranks e.g. "Restart run" above "Language: Rust" for "rust".
 */
function filterCommands(value: string, search: string, keywords: string[] = []) {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  const label = value.toLowerCase();
  const extra = keywords.join(' ').toLowerCase();
  if (words.every((word) => label.includes(word))) return 2;
  if (words.every((word) => label.includes(word) || extra.includes(word))) return 1;
  return 0;
}

export function CommandItem({
  icon: Icon,
  children,
  active,
  keywords,
  onSelect,
}: {
  icon: LucideIcon;
  children: ReactNode;
  active?: boolean;
  keywords?: string[];
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords}
      className="flex h-9 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-ink-dim data-[selected=true]:bg-raised data-[selected=true]:text-ink"
    >
      <Icon size={14} aria-hidden className="shrink-0 text-muted" />
      <span className="flex-1 truncate">{children}</span>
      {active && <Check size={14} aria-label="current" className="text-accent" />}
    </Command.Item>
  );
}

export function CommandGroup({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="px-1 py-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:text-muted"
    >
      {children}
    </Command.Group>
  );
}

/** A modal command palette: search input, filtered list and empty state. */
export default function CommandDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-backdrop backdrop-blur-sm" />
        <Dialog.Content className="fixed top-[12vh] left-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-modal data-[state=open]:animate-pop">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search for a command, then press Enter to run it.
          </Dialog.Description>
          <Command loop label="Commands" filter={filterCommands}>
            <div className="flex items-center gap-3 border-b border-line px-4">
              <SlidersHorizontal size={16} aria-hidden className="text-accent" />
              <Command.Input
                placeholder="Type a command or search…"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
              />
            </div>
            <Command.List className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain p-1">
              <Command.Empty className="py-8 text-center text-sm text-muted">
                No matching commands.
              </Command.Empty>
              {children}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
