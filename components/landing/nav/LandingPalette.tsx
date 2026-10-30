'use client';

import { Code2, Hash, Play, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeCommands from '@/components/command/ThemeCommands';
import CommandDialog, { CommandGroup, CommandItem } from '@/components/ui/CommandDialog';
import { SECTION_LINKS } from '@/data/landing/navigation';
import { LANGUAGE_FILTER_OPTIONS } from '@/lib/languages';
import { updateSettings } from '@/lib/settings';

const SECTIONS = [...SECTION_LINKS, { label: 'How it works', href: '/#how-it-works' }];

export default function LandingPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  // Every command closes the palette after running
  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandGroup heading="Go">
        <CommandItem
          icon={Play}
          keywords={['play', 'test', 'type']}
          onSelect={run(() => router.push('/play'))}
        >
          Start typing
        </CommandItem>
        <CommandItem
          icon={Trophy}
          keywords={['scores', 'ranking']}
          onSelect={run(() => router.push('/play#leaderboard'))}
        >
          Open the live leaderboard
        </CommandItem>
      </CommandGroup>

      <CommandGroup heading="Jump to">
        {SECTIONS.map((section) => (
          <CommandItem
            key={section.href}
            icon={Hash}
            keywords={['section']}
            onSelect={run(() => router.push(section.href))}
          >
            {section.label}
          </CommandItem>
        ))}
      </CommandGroup>

      <ThemeCommands run={run} />

      <CommandGroup heading="Practice a language">
        {LANGUAGE_FILTER_OPTIONS.map((option) => (
          <CommandItem
            key={option.value}
            icon={Code2}
            keywords={['language']}
            onSelect={run(() => {
              updateSettings({ language: option.value });
              router.push('/play');
            })}
          >
            Practice {option.label}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandDialog>
  );
}
