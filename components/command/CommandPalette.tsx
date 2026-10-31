'use client';

import {
  ArrowRight,
  Code2,
  Flame,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Timer,
  ToggleLeft,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeCommands from '@/components/command/ThemeCommands';
import CommandDialog, { CommandGroup, CommandItem as Item } from '@/components/ui/CommandDialog';
import { LANGUAGE_FILTER_OPTIONS } from '@/lib/languages';
import {
  CURSOR_STYLES,
  DURATIONS,
  LENGTH_LABELS,
  LENGTHS,
  LINE_COUNTS,
  updateSettings,
  useSettings,
  type Settings,
} from '@/lib/settings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
  onRestart,
  onNext,
  onOpenSettings,
  onOpenProfile,
}: Props) {
  const router = useRouter();
  const settings = useSettings();

  // Every command closes the palette after running
  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };
  const set = (patch: Partial<Settings>) => run(() => updateSettings(patch));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandGroup heading="Actions">
        <Item icon={RefreshCw} onSelect={run(onRestart)} keywords={['reset']}>
          Restart run
        </Item>
        <Item icon={ArrowRight} onSelect={run(onNext)} keywords={['skip', 'new']}>
          Next snippet
        </Item>
        <Item icon={Settings2} onSelect={run(onOpenSettings)} keywords={['preferences', 'options']}>
          Open settings
        </Item>
        <Item icon={UserRound} onSelect={run(onOpenProfile)} keywords={['username', 'history']}>
          Edit profile
        </Item>
        <Item
          icon={Flame}
          onSelect={run(() => router.push('/account'))}
          keywords={['account', 'streak', 'heatmap', 'contributions', 'stats']}
        >
          View account & streaks
        </Item>
      </CommandGroup>

      <ThemeCommands run={run} />

      <CommandGroup heading="Mode">
        {DURATIONS.map((duration) => (
          <Item
            key={duration}
            icon={Timer}
            active={settings.mode === 'time' && settings.duration === duration}
            onSelect={set({ mode: 'time', duration })}
          >
            Time: {duration} seconds
          </Item>
        ))}
        {LINE_COUNTS.map((lineCount) => (
          <Item
            key={lineCount}
            icon={Timer}
            active={settings.mode === 'lines' && settings.lineCount === lineCount}
            onSelect={set({ mode: 'lines', lineCount })}
          >
            Lines: {lineCount}
          </Item>
        ))}
        <Item icon={Timer} active={settings.mode === 'zen'} onSelect={set({ mode: 'zen' })}>
          Zen: no limit
        </Item>
        <Item icon={Timer} active={settings.mode === 'custom'} onSelect={set({ mode: 'custom' })}>
          Custom text
        </Item>
      </CommandGroup>

      <CommandGroup heading="Language">
        {LANGUAGE_FILTER_OPTIONS.map((option) => (
          <Item
            key={option.value}
            icon={Code2}
            active={settings.language === option.value}
            keywords={['language']}
            onSelect={set({ language: option.value })}
          >
            Language: {option.label}
          </Item>
        ))}
      </CommandGroup>

      <CommandGroup heading="Snippets & typing">
        {LENGTHS.map((length) => (
          <Item
            key={length}
            icon={SlidersHorizontal}
            active={settings.length === length}
            onSelect={set({ length })}
          >
            Length: {LENGTH_LABELS[length]}
          </Item>
        ))}
        {CURSOR_STYLES.map((cursorStyle) => (
          <Item
            key={cursorStyle}
            icon={SlidersHorizontal}
            active={settings.cursorStyle === cursorStyle}
            onSelect={set({ cursorStyle })}
          >
            Cursor: {cursorStyle}
          </Item>
        ))}
        {(
          [
            ['punctuation', 'Punctuation & symbols'],
            ['indentation', 'Keep indentation'],
            ['autoIndent', 'Auto-indent on Enter'],
            ['skipComments', 'Skip comments'],
            ['ligatures', 'Ligatures'],
          ] as const
        ).map(([key, label]) => (
          <Item key={key} icon={ToggleLeft} keywords={['toggle']} onSelect={set({ [key]: !settings[key] })}>
            {settings[key] ? 'Turn off' : 'Turn on'}: {label}
          </Item>
        ))}
      </CommandGroup>
    </CommandDialog>
  );
}
