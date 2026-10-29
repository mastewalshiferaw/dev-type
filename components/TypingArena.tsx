'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Timer, Code2, AlignLeft } from 'lucide-react';
import SegmentedControl, { SegmentedOption } from '@/components/SegmentedControl';
import SnippetView from '@/components/SnippetView';
import { SNIPPETS, Snippet, Language, SnippetLength } from '@/lib/snippets';

const LANGUAGE_OPTIONS: SegmentedOption<Language>[] = (
  ['All', 'JavaScript', 'Python', 'Rust', 'C++'] as const
).map((value) => ({ value, label: value }));
const DURATION_OPTIONS: SegmentedOption<number>[] = [15, 30, 60].map((value) => ({
  value,
  label: `${value}s`,
}));
const LENGTH_OPTIONS: SegmentedOption<SnippetLength>[] = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
];

// Tallest snippet per length, so the code panel keeps a stable height within a setting
const MIN_LINES = SNIPPETS.reduce(
  (acc, { length, code }) => ({ ...acc, [length]: Math.max(acc[length], code.split('\n').length) }),
  { short: 0, medium: 0, long: 0 } as Record<SnippetLength, number>
);

interface Props {
  onFinish: (wpm: number, accuracy: number, errors: number) => void;
  /** Bump to start a fresh run from outside (e.g. the result dialog) */
  restartToken?: number;
}

export default function TypingArena({ onFinish, restartToken = 0 }: Props) {
  // Settings
  const [selectedLang, setSelectedLang] = useState<Language>('All');
  const [selectedLength, setSelectedLength] = useState<SnippetLength>('medium');
  const [selectedDuration, setSelectedDuration] = useState<number>(30); // 30 seconds default

  // Typing state
  const [snippet, setSnippet] = useState<Snippet>(SNIPPETS[0]);
  const [cursor, setCursor] = useState(0);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isFinished, setIsFinished] = useState(false);
  const [focused, setFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(false);

  // Latest values for timers/callbacks that must not restart on every keystroke
  const latest = useRef({ cursor, mistakes, startTime, onFinish });
  useEffect(() => {
    latest.current = { cursor, mistakes, startTime, onFinish };
  });

  // Pick a matching snippet based on filters
  const resetTest = useCallback(() => {
    let pool = SNIPPETS.filter((s) => s.length === selectedLength);
    if (selectedLang !== 'All') {
      pool = pool.filter((s) => s.lang === selectedLang);
    }
    if (pool.length === 0) pool = SNIPPETS;

    const random = pool[Math.floor(Math.random() * pool.length)];
    setSnippet(random);
    setCursor(0);
    setMistakes([]);
    setStartTime(null);
    setTimeLeft(selectedDuration);
    setIsFinished(false);
    finishRef.current = false;
    containerRef.current?.focus();
  }, [selectedLang, selectedLength, selectedDuration]);

  // Snippet is picked at random, so it can only be chosen after mount (keeps SSR output deterministic)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetTest();
  }, [resetTest, restartToken]);

  // Finish run calculation
  const finishRun = useCallback((finalCursor: number, finalMistakes: number) => {
    if (finishRef.current) return;
    finishRef.current = true;
    setIsFinished(true);

    const { startTime: started, onFinish: notify } = latest.current;
    const elapsedMinutes = started ? (Date.now() - started) / 60000 : 0.01;
    const totalAttempted = finalCursor;
    const correctChars = Math.max(0, totalAttempted - finalMistakes);

    const calculatedWpm = Math.max(0, Math.round(correctChars / 5 / elapsedMinutes));
    const calculatedAcc =
      totalAttempted > 0 ? Math.max(0, Math.round((correctChars / totalAttempted) * 100)) : 100;

    notify(calculatedWpm, calculatedAcc, finalMistakes);
  }, []);

  // Countdown Timer (derived from the start timestamp so it never restarts while typing)
  useEffect(() => {
    if (!startTime || isFinished) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil(selectedDuration - (Date.now() - startTime) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        finishRun(latest.current.cursor, latest.current.mistakes.length);
      }
    };
    const interval = setInterval(tick, 250);

    return () => clearInterval(interval);
  }, [startTime, isFinished, selectedDuration, finishRun]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Let focused controls (filter buttons) handle their own keys
    if (e.target !== e.currentTarget) return;

    if (e.key === 'Tab') {
      if (e.shiftKey) return; // keep Shift+Tab available for leaving the typing area
      e.preventDefault();
      resetTest();
      return;
    }

    if (isFinished) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') return;
    e.preventDefault();

    // Start on first keypress
    if (!startTime) {
      setStartTime(Date.now());
    }

    const expectedChar = snippet.code[cursor];

    // Backspace
    if (e.key === 'Backspace') {
      if (cursor > 0) {
        setCursor((prev) => prev - 1);
        setMistakes((prev) => prev.filter((idx) => idx !== cursor - 1));
      }
      return;
    }

    // Enter Key (with auto-skipping indent)
    if (e.key === 'Enter') {
      if (expectedChar === '\n') {
        let nextIndex = cursor + 1;
        while (nextIndex < snippet.code.length && snippet.code[nextIndex] === ' ') {
          nextIndex++;
        }
        setCursor(nextIndex);
        if (nextIndex >= snippet.code.length) finishRun(nextIndex, mistakes.length);
      } else {
        setMistakes((prev) => [...prev, cursor]);
      }
      return;
    }

    // Character Match
    const nextIndex = cursor + 1;
    if (e.key === expectedChar) {
      setCursor(nextIndex);
      if (nextIndex >= snippet.code.length) finishRun(nextIndex, mistakes.length);
    } else {
      const nextMistakes = mistakes.includes(cursor) ? mistakes : [...mistakes, cursor];
      setMistakes(nextMistakes);
      setCursor(nextIndex);
      if (nextIndex >= snippet.code.length) finishRun(nextIndex, nextMistakes.length);
    }
  };

  const announcement = !startTime
    ? ''
    : isFinished
      ? 'Time is up. Run finished.'
      : timeLeft <= 10 && timeLeft % 5 === 0
        ? `${timeLeft} seconds left`
        : '';

  return (
    <div className="@container flex w-full max-w-4xl flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface/60 p-1 @min-[46rem]:flex-row @min-[46rem]:justify-center @min-[46rem]:gap-x-2">
        <SegmentedControl
          label="Language"
          icon={Code2}
          options={LANGUAGE_OPTIONS}
          value={selectedLang}
          onChange={setSelectedLang}
        />
        <span aria-hidden className="hidden h-5 w-px bg-line-strong @min-[46rem]:block" />
        <SegmentedControl
          label="Duration"
          icon={Timer}
          options={DURATION_OPTIONS}
          value={selectedDuration}
          onChange={setSelectedDuration}
        />
        <span aria-hidden className="hidden h-5 w-px bg-line-strong @min-[46rem]:block" />
        <SegmentedControl
          label="Snippet length"
          icon={AlignLeft}
          options={LENGTH_OPTIONS}
          value={selectedLength}
          onChange={setSelectedLength}
        />
      </div>

      {/* Timer + restart */}
      <div className="flex items-center justify-between">
        <div role="timer" aria-label="Time remaining" className="flex items-baseline gap-2">
          <span className="min-w-[2ch] text-3xl font-bold tabular-nums text-accent">{timeLeft}</span>
          <span className="label text-muted">sec</span>
        </div>
        <button
          type="button"
          onClick={resetTest}
          aria-keyshortcuts="Tab"
          className="transition-ui inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs text-muted hover:bg-raised/60 hover:text-accent"
        >
          <RefreshCw size={14} aria-hidden />
          Restart
          <kbd className="rounded-sm border border-line-strong px-1.5 py-0.5 text-2xs text-muted">Tab</kbd>
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Code card */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="textbox"
        aria-multiline
        aria-label="Typing area. Type the code shown. Tab restarts, Shift+Tab leaves."
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`transition-ui relative w-full select-none rounded-xl border bg-surface p-4 pb-10 shadow-panel outline-none sm:p-8 sm:pb-12 ${
          focused ? 'border-line-strong ring-2 ring-accent/30' : 'border-line'
        } ${isFinished ? 'opacity-70' : ''}`}
      >
        <SnippetView
          code={snippet.code}
          cursor={cursor}
          mistakes={mistakes}
          minLines={MIN_LINES[selectedLength]}
        />
        {!focused && !isFinished && (
          <p className="label pointer-events-none absolute right-4 bottom-3 text-muted sm:right-8 sm:bottom-4">
            Click to start typing
          </p>
        )}
      </div>
    </div>
  );
}
