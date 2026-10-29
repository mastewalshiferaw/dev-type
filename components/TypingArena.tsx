'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Timer, Code2, AlignLeft } from 'lucide-react';
import { SNIPPETS, Snippet, Language, SnippetLength } from '@/lib/snippets';

interface Props {
  onFinish: (wpm: number, accuracy: number) => void;
}

export default function TypingArena({ onFinish }: Props) {
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

  const containerRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(false);
  const cursorRef = useRef(0);
  cursorRef.current = cursor;

  // Reset Test
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

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Finish run calculation
  const finishRun = useCallback(
    (finalCursor: number) => {
      if (finishRef.current) return;
      finishRef.current = true;
      setIsFinished(true);

      const elapsedMinutes = startTime ? (Date.now() - startTime) / 60000 : 0.01;
      const totalAttempted = finalCursor;
      const correctChars = Math.max(0, totalAttempted - mistakes.length);

      const calculatedWpm = Math.max(0, Math.round(correctChars / 5 / elapsedMinutes));
      const calculatedAcc =
        totalAttempted > 0 ? Math.max(0, Math.round((correctChars / totalAttempted) * 100)) : 100;

      // Defer triggering parent update to avoid React render conflict
      setTimeout(() => {
        onFinish(calculatedWpm, calculatedAcc);
      }, 0);
    },
    [startTime, mistakes.length, onFinish]
  );

  // High-precision Timestamp Timer (Never lags, never desyncs)
  useEffect(() => {
    if (!startTime || isFinished || selectedDuration === 0) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = selectedDuration - elapsedSeconds;

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        finishRun(cursorRef.current);
      } else {
        setTimeLeft(remaining);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [startTime, isFinished, selectedDuration, finishRun]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
      return;
    }

    if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') return;

    // Start timer on first valid keypress
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

    // Enter Key (with smart auto-indent)
    if (e.key === 'Enter') {
      if (expectedChar === '\n') {
        let nextIndex = cursor + 1;
        while (nextIndex < snippet.code.length && snippet.code[nextIndex] === ' ') {
          nextIndex++;
        }
        setCursor(nextIndex);
        if (nextIndex >= snippet.code.length) finishRun(nextIndex);
      } else {
        setMistakes((prev) => [...prev, cursor]);
      }
      return;
    }

    // Standard character match
    if (e.key === expectedChar) {
      const nextIndex = cursor + 1;
      setCursor(nextIndex);
      if (nextIndex >= snippet.code.length) finishRun(nextIndex);
    } else {
      if (!mistakes.includes(cursor)) {
        setMistakes((prev) => [...prev, cursor]);
      }
      setCursor((prev) => prev + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none flex flex-col justify-center items-center w-full max-w-3xl"
    >
      {/* Settings Bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-6 px-4 py-2 bg-zinc-900/60 border border-zinc-800/80 rounded-xl text-xs font-mono text-zinc-400">
        {/* Language Filter */}
        <div className="flex items-center gap-1.5">
          <Code2 size={13} className="text-amber-400" />
          {(['All', 'JavaScript', 'Python', 'Rust', 'C++'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-2 py-0.5 rounded transition ${
                selectedLang === lang ? 'text-amber-400 font-bold bg-zinc-800' : 'hover:text-zinc-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <span className="text-zinc-700">|</span>

        {/* Time Filter */}
        <div className="flex items-center gap-1.5">
          <Timer size={13} className="text-amber-400" />
          {[15, 30, 60].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedDuration(t)}
              className={`px-2 py-0.5 rounded transition ${
                selectedDuration === t ? 'text-amber-400 font-bold bg-zinc-800' : 'hover:text-zinc-200'
              }`}
            >
              {t}s
            </button>
          ))}
        </div>

        <span className="text-zinc-700">|</span>

        {/* Length Filter */}
        <div className="flex items-center gap-1.5">
          <AlignLeft size={13} className="text-amber-400" />
          {(['short', 'medium', 'long'] as SnippetLength[]).map((len) => (
            <button
              key={len}
              onClick={() => setSelectedLength(len)}
              className={`capitalize px-2 py-0.5 rounded transition ${
                selectedLength === len ? 'text-amber-400 font-bold bg-zinc-800' : 'hover:text-zinc-200'
              }`}
            >
              {len}
            </button>
          ))}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="w-full flex justify-between items-center mb-3 text-sm font-mono">
        <div className="text-2xl font-black text-amber-400 tracking-tight flex items-baseline gap-1">
          <span>{timeLeft}</span>
          <span className="text-xs text-zinc-500 font-normal">sec</span>
        </div>

        <button
          onClick={resetTest}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition"
        >
          <RefreshCw size={12} /> Restart (Tab)
        </button>
      </div>

      {/* Code Card */}
      <div className="w-full bg-zinc-900/90 p-8 rounded-xl border border-zinc-800 font-mono text-lg leading-relaxed shadow-2xl relative select-none">
        <pre className="whitespace-pre-wrap break-all">
          {snippet.code.split('').map((char, index) => {
            let color = 'text-zinc-600';
            if (index < cursor) {
              color = mistakes.includes(index) ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-400';
            }
            const isCursor = index === cursor;

            return (
              <span key={index} className={`relative ${color}`}>
                {isCursor && (
                  <span className="absolute -left-0.5 top-0 bottom-0 w-0.5 bg-amber-400 animate-pulse" />
                )}
                {char === '\n' ? '↵\n' : char}
              </span>
            );
          })}
        </pre>
      </div>
    </div>
  );
}