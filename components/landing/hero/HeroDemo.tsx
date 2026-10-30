'use client';

import { ArrowRight, FileCode2, MousePointerClick, RefreshCw } from 'lucide-react';
import { useInView } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import CodeView from '@/components/typing/CodeView';
import { buttonClass, ButtonLink } from '@/components/ui/Button';
import Kbd from '@/components/ui/Kbd';
import { DEMO_ROWS, DEMO_SNIPPETS } from '@/data/landing/demo';
import { useHiddenInput } from '@/hooks/useHiddenInput';
import { computeStats, createEngineState, engineReducer, type EngineAction } from '@/lib/engine';

const TICK_MS = 250;
/** A run nobody has touched for this long starts over, so the clock never runs away */
const IDLE_RESET_MS = 5000;
/** WPM over the first couple of seconds is noise (one fast key reads as 200 wpm) */
const WPM_AFTER_MS = 2000;

const KEY_ACTIONS = new Set<EngineAction['type']>(['type', 'enter', 'indent', 'backspace']);

/**
 * A working miniature of the typing test: same engine, same code view, same hidden input (so
 * phone keyboards work). Keys: type to start, Tab for the next snippet, Escape to leave; after
 * finishing, Enter opens the full test.
 */
export default function HeroDemo() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [runId, setRunId] = useState(0);
  const [state, setState] = useState(() => createEngineState(DEMO_SNIPPETS[0].code));
  const [now, setNow] = useState(0);
  const [focused, setFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastKeyAt = useRef(0);
  const inView = useInView(cardRef);

  const snippet = DEMO_SNIPPETS[index];
  const finished = state.status === 'finished';

  const dispatch = useCallback((action: EngineAction) => {
    if (KEY_ACTIONS.has(action.type)) lastKeyAt.current = Date.now();
    setState((current) => engineReducer(current, action));
  }, []);

  const nextSnippet = () => {
    const next = (index + 1) % DEMO_SNIPPETS.length;
    setIndex(next);
    setRunId((id) => id + 1);
    setState(createEngineState(DEMO_SNIPPETS[next].code));
    setNow(0);
    // From the "Next snippet" button, focus would otherwise drop to the page as the result unmounts
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };

  const { resetField, inputProps } = useHiddenInput({ inputRef, state, dispatch, onRestart: nextSnippet });

  // Every run starts with a clean field
  useEffect(() => resetField(), [runId, resetField]);

  // Clock while typing; an abandoned run quietly resets to the same snippet
  const { status } = state;
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      const time = Date.now();
      if (time - lastKeyAt.current > IDLE_RESET_MS) {
        setState((current) => createEngineState(current.text));
        setRunId((run) => run + 1);
        setNow(0);
      } else {
        setNow(time);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status]);

  // "Press any key to start" while the demo is on screen. Space still scrolls the page.
  useEffect(() => {
    if (!inView) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const idle = !document.activeElement || document.activeElement === document.body;
      if (!idle || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length === 1 && event.key !== ' ') inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inView]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
      return;
    }
    if (finished && event.key === 'Enter') {
      event.preventDefault();
      router.push('/play');
      return;
    }
    // Tab (indent or next snippet), Enter, Backspace
    inputProps.onKeyDown(event);
  };

  // Neutral until the first key, and WPM only once it means something
  const stats =
    state.startedAt === null ? null : computeStats(state, state.endedAt ?? Math.max(now, state.startedAt));
  const elapsedMs = stats?.durationMs ?? 0;
  const wpm = stats && (finished || elapsedMs >= WPM_AFTER_MS) ? stats.wpm : 0;
  const accuracy = stats ? Math.round(stats.accuracy) : 100;
  const progress = state.input.length / state.text.length;

  return (
    <div ref={cardRef} className="relative">
      {/* Soft glow behind the window; the token keeps it faint in light mode */}
      <div aria-hidden className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-xl bg-glow blur-3xl" />

      <div
        className={`overflow-hidden rounded-xl border bg-surface text-left shadow-lift transition-ui ${
          focused ? 'border-line-hover' : 'border-line-strong'
        }`}
      >
        {/* Editor chrome: window dots, the file tab sitting on the divider, live stats */}
        <div className="flex h-11 items-end justify-between gap-4 border-b border-line bg-raised/50 px-4">
          <div className="flex h-full min-w-0 items-end gap-4">
            <span aria-hidden className="flex h-full items-center gap-2">
              <span className="size-3 rounded-full bg-line-strong" />
              <span className="size-3 rounded-full bg-line-strong" />
              <span className="size-3 rounded-full bg-line-strong" />
            </span>
            <span className="-mb-px flex h-9 min-w-0 items-center gap-2 rounded-t-sm border border-b-0 border-line bg-surface px-4 text-xs text-ink">
              <FileCode2 size={14} strokeWidth={1.75} aria-hidden className="shrink-0 text-accent" />
              <span className="truncate">{snippet.file}</span>
            </span>
          </div>
          <p
            aria-hidden
            className="flex h-full items-center gap-2 text-xs whitespace-nowrap text-muted tabular-nums"
          >
            <span>
              <span className="inline-block min-w-[3ch] text-right font-bold text-ink">{wpm}</span> wpm
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden min-w-[4ch] text-right font-semibold text-ink-dim sm:inline-block">
              {accuracy}%
            </span>
            <span>·</span>
            <span>
              <span className="inline-block min-w-[2ch] text-right font-semibold text-ink-dim">
                {Math.floor(elapsedMs / 1000)}
              </span>
              s
            </span>
          </p>
        </div>

        {/* Code */}
        <div data-cursor="text" className="relative px-4 py-6 sm:px-6">
          <CodeView
            text={state.text}
            input={state.input}
            cursorStyle="line"
            font="geist"
            fontSize={17}
            ligatures={false}
            rows={DEMO_ROWS}
            tone="ink"
          />
          <p id="demo-target" className="sr-only">
            {snippet.code}
          </p>
          <p id="demo-help" className="sr-only">
            Tab loads another snippet. Escape leaves the editor.
          </p>

          {/* Stays mounted after finishing (read-only) so Tab and Enter keep working */}
          <textarea
            {...inputProps}
            onKeyDown={onKeyDown}
            readOnly={finished}
            aria-label="Try it: type the code shown"
            aria-describedby="demo-target demo-help"
            onFocus={() => {
              setFocused(true);
              resetField();
            }}
            onBlur={() => setFocused(false)}
            // Covers the code so a tap focuses it directly (needed for iOS keyboards); 16px avoids zoom
            className="absolute inset-0 size-full cursor-text resize-none overflow-hidden bg-transparent text-base text-transparent caret-transparent opacity-0 outline-none"
          />

          {/* Idle hint: the code above it stays sharp and readable */}
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-surface via-surface/90 to-transparent pt-8 pb-4 transition-opacity duration-(--duration-base) ease-out ${
              focused || finished ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span className="flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 text-xs text-ink-dim shadow-panel">
              <MousePointerClick size={14} strokeWidth={1.75} className="text-accent" />
              Click or press any key to start
              <span className="h-3.5 w-0.5 animate-blink bg-caret" />
            </span>
          </div>

          {finished && stats && (
            <div className="absolute inset-0 z-10 flex animate-fade-in flex-col items-center justify-center gap-4 bg-surface px-4 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
              <div>
                <p className="label text-muted">Snippet complete</p>
                <p className="mt-1 flex items-baseline justify-center gap-4 text-sm text-ink-dim tabular-nums sm:justify-start">
                  <span>
                    <span className="text-3xl font-bold text-accent sm:text-4xl">{stats.wpm}</span>{' '}
                    <span className="text-muted">wpm</span>
                  </span>
                  <span>
                    <span className="font-semibold text-ink">{Math.round(stats.accuracy)}%</span> acc
                  </span>
                  <span>{(stats.durationMs / 1000).toFixed(1)}s</span>
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 sm:items-end">
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={nextSnippet} className={buttonClass('secondary', 'sm')}>
                    <RefreshCw size={14} aria-hidden />
                    Next snippet
                  </button>
                  <ButtonLink href="/play" size="sm">
                    Play the full version
                    <ArrowRight size={14} aria-hidden />
                  </ButtonLink>
                </div>
                <p aria-hidden className="hidden items-center gap-2 text-2xs text-muted sm:flex">
                  <Kbd>Tab</Kbd> next <Kbd>Enter</Kbd> full version
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress: keyed per run so a new snippet starts at zero instead of animating backwards */}
        <div aria-hidden className="h-0.5 w-full bg-line">
          <div
            key={runId}
            className="h-full origin-left bg-accent-fill transition-transform duration-(--duration-base) ease-out"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>

        {/* Status bar */}
        <div className="flex h-9 items-center justify-between gap-4 bg-raised/50 px-4 text-2xs text-muted">
          <span className="flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-accent-fill" />
            {snippet.language}
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Kbd>Tab</Kbd> next snippet
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Kbd>Enter</Kbd> new line
            </span>
            <span className="hidden items-center gap-1 md:flex">
              <Kbd>Esc</Kbd> leave
            </span>
          </span>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {finished && stats
          ? `Snippet complete: ${stats.wpm} words per minute at ${Math.round(stats.accuracy)}% accuracy. Press Tab for another snippet or Enter to play the full version.`
          : ''}
      </p>
    </div>
  );
}
