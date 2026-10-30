import { isLanguageId, type LanguageFilter } from '@/lib/languages';
import { createLocalStore, useLocalStore } from '@/lib/store';

export type Mode = 'time' | 'lines' | 'zen' | 'custom';
export type SnippetLength = 'short' | 'medium' | 'long' | 'random';
export type CursorStyle = 'line' | 'block' | 'underline';
export type CodeFont = 'jetbrains' | 'fira' | 'geist';

export const MODES: readonly Mode[] = ['time', 'lines', 'zen', 'custom'];
export const DURATIONS = [15, 30, 60, 120] as const;
export const LINE_COUNTS = [10, 25, 50] as const;
export const LENGTHS: readonly SnippetLength[] = ['short', 'medium', 'long', 'random'];
export const CURSOR_STYLES: readonly CursorStyle[] = ['line', 'block', 'underline'];
export const FONT_SIZES = [14, 16, 18, 20, 24] as const;
export const CUSTOM_TEXT_LIMIT = 5000;

export type Duration = (typeof DURATIONS)[number];
export type LineCount = (typeof LINE_COUNTS)[number];
export type FontSize = (typeof FONT_SIZES)[number];

export const CODE_FONTS: Record<CodeFont, { label: string; variable: string }> = {
  jetbrains: { label: 'JetBrains Mono', variable: 'var(--font-jetbrains-mono)' },
  fira: { label: 'Fira Code', variable: 'var(--font-fira-code)' },
  geist: { label: 'Geist Mono', variable: 'var(--font-geist-mono)' },
};

export const MODE_LABELS: Record<Mode, string> = {
  time: 'Time',
  lines: 'Lines',
  zen: 'Zen',
  custom: 'Custom',
};

export const LENGTH_LABELS: Record<SnippetLength, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
  random: 'Random',
};

export interface Settings {
  language: LanguageFilter;
  mode: Mode;
  duration: Duration;
  lineCount: LineCount;
  length: SnippetLength;
  /** Keep punctuation and symbols; off reduces snippets to words and numbers */
  punctuation: boolean;
  /** Keep leading indentation; off strips it */
  indentation: boolean;
  /** Fill the next line's indentation automatically after Enter */
  autoIndent: boolean;
  /** Remove comments from snippets before typing */
  skipComments: boolean;
  cursorStyle: CursorStyle;
  font: CodeFont;
  fontSize: FontSize;
  ligatures: boolean;
  customText: string;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'all',
  mode: 'time',
  duration: 30,
  lineCount: 10,
  length: 'medium',
  punctuation: true,
  indentation: true,
  autoIndent: true,
  skipComments: false,
  cursorStyle: 'line',
  font: 'geist',
  fontSize: 18,
  ligatures: false,
  customText: '',
};

const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

/** Validate stored settings field by field so one bad value never resets the rest. */
export function parseSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  return {
    language: s.language === 'all' || isLanguageId(s.language) ? s.language : d.language,
    mode: pick(s.mode, MODES, d.mode),
    duration: pick(s.duration, DURATIONS, d.duration),
    lineCount: pick(s.lineCount, LINE_COUNTS, d.lineCount),
    length: pick(s.length, LENGTHS, d.length),
    punctuation: bool(s.punctuation, d.punctuation),
    indentation: bool(s.indentation, d.indentation),
    autoIndent: bool(s.autoIndent, d.autoIndent),
    skipComments: bool(s.skipComments, d.skipComments),
    cursorStyle: pick(s.cursorStyle, CURSOR_STYLES, d.cursorStyle),
    font: pick(s.font, Object.keys(CODE_FONTS) as CodeFont[], d.font),
    fontSize: pick(s.fontSize, FONT_SIZES, d.fontSize),
    ligatures: bool(s.ligatures, d.ligatures),
    customText: typeof s.customText === 'string' ? s.customText.slice(0, CUSTOM_TEXT_LIMIT) : d.customText,
  };
}

export const settingsStore = createLocalStore<Settings>('devtype:settings', DEFAULT_SETTINGS, parseSettings);

export function useSettings(): Settings {
  return useLocalStore(settingsStore);
}

export function updateSettings(patch: Partial<Settings>) {
  settingsStore.set((prev) => ({ ...prev, ...patch }));
}

/** Key for personal bests and leaderboard grouping, e.g. `time-30`, `lines-25`, `zen`. */
export function modeKey(settings: Pick<Settings, 'mode' | 'duration' | 'lineCount'>): string {
  if (settings.mode === 'time') return `time-${settings.duration}`;
  if (settings.mode === 'lines') return `lines-${settings.lineCount}`;
  return settings.mode;
}

export function modeKeyLabel(key: string): string {
  const [mode, value] = key.split('-');
  if (mode === 'time') return `${value}s`;
  if (mode === 'lines') return `${value} lines`;
  return MODE_LABELS[mode as Mode] ?? key;
}

/** Ranked modes produce comparable scores; zen and custom runs stay local. */
export function isRankedMode(mode: Mode): boolean {
  return mode === 'time' || mode === 'lines';
}
