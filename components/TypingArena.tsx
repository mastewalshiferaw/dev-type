'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { SNIPPETS, Snippet } from '@/lib/snippets';

interface Props {
  onFinish: (wpm: number, accuracy: number) => void;
}

export default function TypingArena({ onFinish }: Props) {
  const [snippet, setSnippet] = useState<Snippet>(SNIPPETS[0]);
  const [cursor, setCursor] = useState(0);
  const [mistakes, setMistakes] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTest = useCallback(() => {
    const random = SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
    setSnippet(random);
    setCursor(0);
    setMistakes([]);
    setStartTime(null);
    setIsFinished(false);
    containerRef.current?.focus();
  }, []);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished) return;

    // Tab key restarts the test
    if (e.key === 'Tab') {
      e.preventDefault();
      resetTest();
      return;
    }

    if (e.key.length > 1 && e.key !== 'Enter' && e.key !== 'Backspace') return;

    if (!startTime) setStartTime(Date.now());

    const expectedChar = snippet.code[cursor];

    // Backspace handling
    if (e.key === 'Backspace') {
      if (cursor > 0) {
        setCursor((prev) => prev - 1);
        setMistakes((prev) => prev.filter((idx) => idx !== cursor - 1));
      }
      return;
    }

    // Enter Key with Smart Indentation
    if (e.key === 'Enter') {
      if (expectedChar === '\n') {
        let nextIndex = cursor + 1;
        // Skip leading indentation spaces on the new line automatically
        while (nextIndex < snippet.code.length && snippet.code[nextIndex] === ' ') {
          nextIndex++;
        }
        setCursor(nextIndex);
        checkFinish(nextIndex);
      } else {
        setMistakes((prev) => [...prev, cursor]);
      }
      return;
    }

    // Character Matching
    if (e.key === expectedChar) {
      const nextIndex = cursor + 1;
      setCursor(nextIndex);
      checkFinish(nextIndex);
    } else {
      if (!mistakes.includes(cursor)) {
        setMistakes((prev) => [...prev, cursor]);
      }
      setCursor((prev) => prev + 1);
    }
  };

  const checkFinish = (nextIndex: number) => {
    if (nextIndex >= snippet.code.length) {
      setIsFinished(true);
      const timeInMinutes = (Date.now() - (startTime || Date.now())) / 60000;
      const totalChars = snippet.code.length;
      const correctChars = totalChars - mistakes.length;
      const calculatedWpm = Math.max(0, Math.round((correctChars / 5) / (timeInMinutes || 0.01)));
      const calculatedAcc = Math.max(0, Math.round((correctChars / totalChars) * 100));
      onFinish(calculatedWpm, calculatedAcc);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none flex flex-col justify-center items-center w-full max-w-2xl"
    >
      <div className="w-full flex justify-between items-center mb-4 text-xs font-mono text-zinc-500">
        <span>Language: <span className="text-amber-400 font-semibold">{snippet.lang}</span></span>
        <button
          onClick={resetTest}
          className="flex items-center gap-1.5 hover:text-amber-400 transition"
        >
          <RefreshCw size={13} /> Restart (Tab)
        </button>
      </div>

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