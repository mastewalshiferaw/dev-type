'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ClipboardPaste, MousePointerClick, RefreshCw, Square } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import CodeView from '@/components/typing/CodeView';
import Timer from '@/components/typing/Timer';
import Kbd from '@/components/ui/Kbd';
import Skeleton from '@/components/ui/Skeleton';
import type { RunInfo } from '@/hooks/useTypingRun';
import { canIndent, type EngineAction, type EngineState } from '@/lib/engine';
import type { Settings } from '@/lib/settings';

/** The hidden textarea always holds this, so mobile Backspace has something to delete */
const SENTINEL = ' ';
const MIN_ROWS = 3;
const MAX_ROWS = 9;
const STREAM_ROWS = 7;

interface Props {
  state: EngineState;
  run: RunInfo | null;
  settings: Settings;
  elapsedMs: number;
  liveWpm: number | null;
  dispatch: (action: EngineAction) => void;
  onRestart: () => void;
  onFinish: () => void;
  onEditCustomText: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function TypingArena({
  state,
  run,
  settings,
  elapsedMs,
  liveWpm,
  dispatch,
  onRestart,
  onFinish,
  onEditCustomText,
  inputRef,
}: Props) {
  const lastValue = useRef(SENTINEL);
  const composing = useRef(false);
  const [focused, setFocused] = useState(false);

  const isTime = settings.mode === 'time';
  const canFinishManually = settings.mode === 'zen' || settings.mode === 'custom';
  const running = state.status === 'running';
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const seconds = isTime
    ? state.status === 'idle'
      ? settings.duration
      : Math.max(0, Math.ceil(settings.duration - elapsedMs / 1000))
    : elapsedSeconds;

  const lineCount = run ? run.text.split('\n').length : 0;
  const rows = !run ? 6 : run.streaming ? STREAM_ROWS : Math.min(MAX_ROWS, Math.max(MIN_ROWS, lineCount));
  const progress =
    run && !run.streaming && state.text.length > 0 ? state.input.length / state.text.length : null;
  const isEmptyCustom = run?.language === 'custom' && run.text.length === 0;

  const resetField = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.value = SENTINEL;
      // Caret after the sentinel, so Backspace on a mobile keyboard always has it to delete
      el.setSelectionRange(SENTINEL.length, SENTINEL.length);
    }
    lastValue.current = SENTINEL;
  }, [inputRef]);

  // A new run starts with a clean field
  const runId = run?.id;
  useEffect(() => resetField(), [runId, resetField]);

  // Focus once the first snippet is ready (later runs keep focus where the user put it)
  const ready = !!run;
  useEffect(() => {
    if (ready) inputRef.current?.focus({ preventScroll: true });
  }, [ready, inputRef]);

  const typeText = (text: string) => {
    const now = Date.now();
    for (const ch of text) {
      if (ch === '\n' || ch === '\r') dispatch({ type: 'enter', now });
      else if (ch === '\t') dispatch({ type: 'indent', now });
      else dispatch({ type: 'type', char: ch, now });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    const now = Date.now();

    if (event.key === 'Tab') {
      if (event.shiftKey) return; // Shift+Tab leaves the typing area
      event.preventDefault();
      if (canIndent(state)) dispatch({ type: 'indent', now });
      else onRestart();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.shiftKey && canFinishManually && running) onFinish();
      else dispatch({ type: 'enter', now });
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'backspace', word: event.ctrlKey || event.altKey || event.metaKey });
    }
  };

  /**
   * Characters arrive here rather than through keydown, because mobile keyboards and IMEs
   * report most keys as "Unidentified". The field is diffed against its previous value.
   */
  const onInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const el = event.currentTarget;
    const value = el.value;
    const previous = lastValue.current;
    // Diff on both ends: the caret may sit before the sentinel, so text can land on either side
    let prefix = 0;
    while (prefix < value.length && prefix < previous.length && value[prefix] === previous[prefix]) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < value.length - prefix &&
      suffix < previous.length - prefix &&
      value[value.length - 1 - suffix] === previous[previous.length - 1 - suffix]
    ) {
      suffix++;
    }
    const deleted = previous.length - prefix - suffix;
    for (let i = 0; i < deleted; i++) dispatch({ type: 'backspace', word: false });
    typeText(value.slice(prefix, value.length - suffix));

    if (composing.current) lastValue.current = value;
    else resetField();
  };

  const focusInput = () => inputRef.current?.focus();

  const announcement = !running
    ? state.status === 'finished'
      ? 'Run finished.'
      : ''
    : isTime && seconds <= 10 && seconds % 5 === 0
      ? `${seconds} seconds left`
      : '';

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Timer, live stats and restart */}
      <div className="flex min-h-12 items-center justify-between gap-3">
        <div className="flex items-baseline gap-5">
          <div role="timer" aria-label={isTime ? 'Time remaining' : 'Time elapsed'}>
            <Timer seconds={seconds} countdown={isTime} urgent={isTime && running && seconds <= 5} />
          </div>
          <p className="hidden items-baseline gap-1.5 text-muted tabular-nums sm:flex" aria-hidden>
            <span className="min-w-[3ch] text-right text-lg font-semibold text-ink-dim">
              {liveWpm ?? '–'}
            </span>
            <span className="label">wpm</span>
          </p>
          {progress !== null && (
            <p className="hidden items-baseline gap-1.5 text-muted tabular-nums sm:flex" aria-hidden>
              <span className="min-w-[4ch] text-right text-lg font-semibold text-ink-dim">
                {Math.round(progress * 100)}%
              </span>
              <span className="label">done</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canFinishManually && running && (
            <button
              type="button"
              onClick={onFinish}
              aria-keyshortcuts="Shift+Enter"
              className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs text-muted transition-ui hover:bg-raised hover:text-ink"
            >
              <Square size={12} aria-hidden />
              Finish
              <span className="hidden sm:inline">
                <Kbd>⇧ Enter</Kbd>
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            aria-keyshortcuts="Tab"
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs text-muted transition-ui hover:bg-raised hover:text-accent"
          >
            <RefreshCw size={14} aria-hidden />
            Restart
            <span className="hidden sm:inline">
              <Kbd>Tab</Kbd>
            </span>
          </button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Code card */}
      <div
        onClick={focusInput}
        className={`relative w-full rounded-xl border bg-surface p-4 shadow-panel transition-ui sm:p-8 ${
          focused ? 'border-line-strong ring-2 ring-accent/30' : 'border-line'
        }`}
      >
        {isEmptyCustom ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ClipboardPaste size={24} aria-hidden className="text-accent" />
            <p className="text-sm text-ink">No custom text yet</p>
            <p className="max-w-xs text-xs text-muted">
              Paste your own code in settings and practice exactly what you write every day.
            </p>
            <button
              type="button"
              onClick={onEditCustomText}
              className="mt-1 h-9 rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
            >
              Paste code
            </button>
          </div>
        ) : run ? (
          <>
            <CodeView
              text={state.text}
              input={state.input}
              cursorStyle={settings.cursorStyle}
              font={settings.font}
              fontSize={settings.fontSize}
              ligatures={settings.ligatures}
              rows={rows}
            />
            <p id="typing-target" className="sr-only">
              {run.initialText}
            </p>
          </>
        ) : (
          <div role="status" aria-label="Loading snippet" className="flex flex-col gap-3 py-1">
            {[80, 64, 72, 40, 56, 30].map((width) => (
              <Skeleton key={width} className="h-5" />
            ))}
          </div>
        )}

        {!isEmptyCustom && (
          <textarea
            ref={inputRef}
            defaultValue={SENTINEL}
            aria-label="Type the code shown. Tab restarts, Shift+Tab leaves the typing area."
            aria-describedby={run ? 'typing-target' : undefined}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="enter"
            readOnly={state.status === 'finished'}
            onKeyDown={onKeyDown}
            onInput={onInput}
            onPaste={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
              resetField();
            }}
            onFocus={() => {
              setFocused(true);
              resetField();
            }}
            onBlur={() => setFocused(false)}
            // Covers the card so a tap focuses it directly (needed for iOS keyboards); 16px avoids zoom
            className="absolute inset-0 size-full cursor-text resize-none overflow-hidden bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none"
          />
        )}

        <AnimatePresence>
          {!focused && run && !isEmptyCustom && state.status !== 'finished' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[3px]"
            >
              <span className="flex items-center gap-2 rounded-md border border-line-strong bg-surface px-4 py-2 text-sm text-ink shadow-panel">
                <MousePointerClick size={16} aria-hidden className="text-accent" />
                Click here or press any key to focus
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed-height progress bar keeps the layout steady across modes */}
      <div aria-hidden className="h-0.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full origin-left bg-accent-fill transition-transform duration-200"
          style={{
            transform: `scaleX(${
              isTime ? Math.min(1, elapsedMs / (settings.duration * 1000)) : (progress ?? 0)
            })`,
          }}
        />
      </div>
    </div>
  );
}
