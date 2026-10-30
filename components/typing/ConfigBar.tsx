'use client';

import { AnimatePresence, motion } from 'motion/react';
import { AlignLeft, Code2, Infinity as InfinityIcon, Pencil, Settings2 } from 'lucide-react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { LANGUAGE_FILTER_OPTIONS } from '@/lib/languages';
import {
  DURATIONS,
  LENGTH_LABELS,
  LENGTHS,
  LINE_COUNTS,
  MODE_LABELS,
  MODES,
  updateSettings,
  type Settings,
} from '@/lib/settings';

const MODE_OPTIONS = MODES.map((value) => ({ value, label: MODE_LABELS[value] }));
const DURATION_OPTIONS = DURATIONS.map((value) => ({ value, label: `${value}s` }));
const LINE_OPTIONS = LINE_COUNTS.map((value) => ({ value, label: `${value}` }));
const LENGTH_OPTIONS = LENGTHS.map((value) => ({ value, label: LENGTH_LABELS[value] }));

interface Props {
  settings: Settings;
  onOpenSettings: (section?: 'custom') => void;
}

function Divider() {
  return <span aria-hidden className="h-5 w-px shrink-0 bg-line-strong" />;
}

export default function ConfigBar({ settings, onOpenSettings }: Props) {
  const { mode } = settings;

  return (
    <div className="@container w-full">
      {/* Mobile: one scrollable row with faded edges. Wide: wraps and centers. */}
      <div
        role="toolbar"
        aria-label="Test configuration"
        className="-mx-4 scrollbar-none overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] px-4 @min-[52rem]:mx-0 @min-[52rem]:overflow-visible @min-[52rem]:[mask-image:none] @min-[52rem]:px-0"
      >
        <div className="flex w-max items-center gap-2 rounded-xl border border-line bg-surface/60 p-1 @min-[52rem]:mx-auto @min-[52rem]:w-fit @min-[52rem]:flex-wrap @min-[52rem]:justify-center">
          <Select
            label="Language"
            icon={Code2}
            value={settings.language}
            options={LANGUAGE_FILTER_OPTIONS}
            onChange={(language) => updateSettings({ language })}
          />
          <Divider />
          <SegmentedControl
            label="Mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={(next) => updateSettings({ mode: next })}
          />
          <Divider />

          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex shrink-0 items-center"
            >
              {mode === 'time' && (
                <SegmentedControl
                  label="Duration"
                  options={DURATION_OPTIONS}
                  value={settings.duration}
                  onChange={(duration) => updateSettings({ duration })}
                />
              )}
              {mode === 'lines' && (
                <SegmentedControl
                  label="Line count"
                  options={LINE_OPTIONS}
                  value={settings.lineCount}
                  onChange={(lineCount) => updateSettings({ lineCount })}
                />
              )}
              {mode === 'zen' && (
                <span className="flex h-9 items-center gap-1.5 px-2 text-xs text-muted">
                  <InfinityIcon size={14} aria-hidden className="text-accent" />
                  No limit
                </span>
              )}
              {mode === 'custom' && (
                <button
                  type="button"
                  onClick={() => onOpenSettings('custom')}
                  className="flex h-9 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-ui hover:bg-raised hover:text-ink"
                >
                  <Pencil size={13} aria-hidden className="text-accent" />
                  Edit text
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {mode !== 'custom' && (
            <>
              <Divider />
              <SegmentedControl
                label="Snippet length"
                icon={AlignLeft}
                options={LENGTH_OPTIONS}
                value={settings.length}
                onChange={(length) => updateSettings({ length })}
              />
            </>
          )}
          <Divider />
          <button
            type="button"
            onClick={() => onOpenSettings()}
            aria-label="Open settings"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-ui hover:bg-raised hover:text-ink"
          >
            <Settings2 size={16} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
