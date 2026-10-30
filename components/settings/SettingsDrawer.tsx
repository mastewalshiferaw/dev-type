'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { RotateCcw, X } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { LANGUAGE_FILTER_OPTIONS } from '@/lib/languages';
import {
  CODE_FONTS,
  CURSOR_STYLES,
  CUSTOM_TEXT_LIMIT,
  DEFAULT_SETTINGS,
  DURATIONS,
  FONT_SIZES,
  LENGTH_LABELS,
  LENGTHS,
  LINE_COUNTS,
  MODE_LABELS,
  MODES,
  updateSettings,
  useSettings,
  type CodeFont,
} from '@/lib/settings';
import { setTheme, THEME_OPTIONS, useThemePreference } from '@/lib/theme';

export type SettingsSection = 'custom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: SettingsSection;
}

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-line py-5 last:border-b-0">
      <h3 className="label text-accent">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  );
}

export default function SettingsDrawer({ open, onOpenChange, section }: Props) {
  const settings = useSettings();
  const theme = useThemePreference();
  const customRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-backdrop backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          onOpenAutoFocus={(event) => {
            if (section === 'custom') {
              event.preventDefault();
              customRef.current?.focus();
            }
          }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-modal data-[state=open]:animate-slide-in"
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-bold text-ink">Settings</Dialog.Title>
              <Dialog.Description className="text-xs text-muted">
                Changes apply instantly and are saved on this device.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close settings"
              className="flex size-9 items-center justify-center rounded-md text-muted transition-ui hover:bg-raised hover:text-ink"
            >
              <X size={18} aria-hidden />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto px-5">
            <Group title="Test">
              <Field label="Language">
                <Select
                  label="Language"
                  value={settings.language}
                  options={LANGUAGE_FILTER_OPTIONS}
                  onChange={(language) => updateSettings({ language })}
                />
              </Field>
              <Field label="Mode">
                <SegmentedControl
                  label="Mode"
                  options={MODES.map((value) => ({ value, label: MODE_LABELS[value] }))}
                  value={settings.mode}
                  onChange={(mode) => updateSettings({ mode })}
                />
              </Field>
              <Field label="Time limit">
                <SegmentedControl
                  label="Time limit"
                  options={DURATIONS.map((value) => ({ value, label: `${value}s` }))}
                  value={settings.duration}
                  onChange={(duration) => updateSettings({ duration })}
                />
              </Field>
              <Field label="Line count">
                <SegmentedControl
                  label="Line count"
                  options={LINE_COUNTS.map((value) => ({ value, label: `${value}` }))}
                  value={settings.lineCount}
                  onChange={(lineCount) => updateSettings({ lineCount })}
                />
              </Field>
              <Field label="Snippet length">
                <SegmentedControl
                  label="Snippet length"
                  options={LENGTHS.map((value) => ({ value, label: LENGTH_LABELS[value] }))}
                  value={settings.length}
                  onChange={(length) => updateSettings({ length })}
                />
              </Field>
            </Group>

            <Group title="Content">
              <div className="flex flex-col">
                <Switch
                  label="Punctuation & symbols"
                  description="Off reduces code to words and numbers."
                  checked={settings.punctuation}
                  onChange={(punctuation) => updateSettings({ punctuation })}
                />
                <Switch
                  label="Keep indentation"
                  description="Off strips leading whitespace from every line."
                  checked={settings.indentation}
                  onChange={(indentation) => updateSettings({ indentation })}
                />
                <Switch
                  label="Auto-indent on Enter"
                  description="Fills the next line's indentation for you. When off, press Tab to indent."
                  checked={settings.autoIndent}
                  onChange={(autoIndent) => updateSettings({ autoIndent })}
                />
                <Switch
                  label="Skip comments"
                  description="Removes comments from snippets before you type them."
                  checked={settings.skipComments}
                  onChange={(skipComments) => updateSettings({ skipComments })}
                />
              </div>
            </Group>

            <Group title="Appearance">
              <Field label="Theme">
                <SegmentedControl
                  label="Theme"
                  options={THEME_OPTIONS.map((value) => ({ value, label: capitalize(value) }))}
                  value={theme}
                  onChange={setTheme}
                />
              </Field>
              <Field label="Cursor">
                <SegmentedControl
                  label="Cursor style"
                  options={CURSOR_STYLES.map((value) => ({ value, label: capitalize(value) }))}
                  value={settings.cursorStyle}
                  onChange={(cursorStyle) => updateSettings({ cursorStyle })}
                />
              </Field>
              <Field label="Code font">
                <Select
                  label="Code font"
                  value={settings.font}
                  options={(Object.keys(CODE_FONTS) as CodeFont[]).map((value) => ({
                    value,
                    label: CODE_FONTS[value].label,
                  }))}
                  onChange={(font) => updateSettings({ font })}
                />
              </Field>
              <Field label="Font size">
                <SegmentedControl
                  label="Font size"
                  options={FONT_SIZES.map((value) => ({ value, label: `${value}` }))}
                  value={settings.fontSize}
                  onChange={(fontSize) => updateSettings({ fontSize })}
                />
              </Field>
              <Switch
                label="Ligatures"
                description="Render => != and friends as single glyphs (JetBrains Mono, Fira Code)."
                checked={settings.ligatures}
                onChange={(ligatures) => updateSettings({ ligatures })}
              />
              <p
                className="rounded-lg border border-line bg-canvas px-3 py-2 text-ink-dim"
                style={{
                  fontFamily: `${CODE_FONTS[settings.font].variable}, var(--font-mono)`,
                  fontSize: settings.fontSize,
                  fontVariantLigatures: settings.ligatures ? 'normal' : 'none',
                }}
                aria-label="Font preview"
              >
                {'const ok = a => a !== null;'}
              </p>
            </Group>

            <Group title="Custom text">
              <label htmlFor="custom-text" className="text-sm text-ink">
                Paste your own code
              </label>
              <textarea
                id="custom-text"
                ref={customRef}
                value={settings.customText}
                onChange={(event) =>
                  updateSettings({ customText: event.target.value.slice(0, CUSTOM_TEXT_LIMIT) })
                }
                rows={8}
                spellCheck={false}
                placeholder={'function hello() {\n  return "world";\n}'}
                aria-describedby="custom-text-count"
                className="w-full resize-y rounded-lg border border-line-strong bg-canvas p-3 text-xs [tab-size:4] text-ink transition-ui placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <p id="custom-text-count" className="text-2xs text-muted tabular-nums">
                  {settings.customText.length}/{CUSTOM_TEXT_LIMIT} characters
                </p>
                <button
                  type="button"
                  disabled={!settings.customText.trim()}
                  onClick={() => {
                    updateSettings({ mode: 'custom' });
                    onOpenChange(false);
                  }}
                  className="h-8 rounded-md bg-accent-fill px-3 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover disabled:opacity-50"
                >
                  {settings.mode === 'custom' ? 'Start typing' : 'Use custom mode'}
                </button>
              </div>
            </Group>
          </div>

          <footer className="border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={() => updateSettings({ ...DEFAULT_SETTINGS, customText: settings.customText })}
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs text-muted transition-ui hover:bg-raised hover:text-ink"
            >
              <RotateCcw size={14} aria-hidden />
              Reset to defaults
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
