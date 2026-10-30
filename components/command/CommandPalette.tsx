'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import {
  ArrowRight,
  Check,
  Code2,
  Monitor,
  Moon,
  RefreshCw,
  Settings2,
  SlidersHorizontal,
  Sun,
  Timer,
  ToggleLeft,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
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
import { setTheme, useThemePreference, type ThemePreference } from '@/lib/theme';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestart: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

const THEME_ICONS: Record<ThemePreference, LucideIcon> = { light: Sun, dark: Moon, system: Monitor };

function Item({
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

const GROUP_CLASS =
  'px-1 py-1 [&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-muted';

export default function CommandPalette({
  open,
  onOpenChange,
  onRestart,
  onNext,
  onOpenSettings,
  onOpenProfile,
}: Props) {
  const settings = useSettings();
  const theme = useThemePreference();

  // Every command closes the palette after running
  const run = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };
  const set = (patch: Partial<Settings>) => run(() => updateSettings(patch));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-backdrop backdrop-blur-sm" />
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

              <Command.Group heading="Actions" className={GROUP_CLASS}>
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
              </Command.Group>

              <Command.Group heading="Theme" className={GROUP_CLASS}>
                {(['light', 'dark', 'system'] as const).map((value) => (
                  <Item
                    key={value}
                    icon={THEME_ICONS[value]}
                    active={theme === value}
                    keywords={['theme', 'mode', 'color']}
                    onSelect={run(() => setTheme(value))}
                  >
                    Theme: {value[0].toUpperCase() + value.slice(1)}
                  </Item>
                ))}
              </Command.Group>

              <Command.Group heading="Mode" className={GROUP_CLASS}>
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
              </Command.Group>

              <Command.Group heading="Language" className={GROUP_CLASS}>
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
              </Command.Group>

              <Command.Group heading="Snippets & typing" className={GROUP_CLASS}>
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
                  <Item
                    key={key}
                    icon={ToggleLeft}
                    keywords={['toggle']}
                    onSelect={set({ [key]: !settings[key] })}
                  >
                    {settings[key] ? 'Turn off' : 'Turn on'}: {label}
                  </Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
