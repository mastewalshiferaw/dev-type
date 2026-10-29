'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  wpm: number;
  accuracy: number;
  errors: number;
  onSubmit: (name: string) => void;
  onDiscard: () => void;
  onRestart: () => void;
}

function Stat({ value, label, tone }: { value: string | number; label: string; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-2 py-4">
      <dd className={`text-3xl font-bold tabular-nums ${tone}`}>{value}</dd>
      <dt className="label mt-1 text-muted">{label}</dt>
    </div>
  );
}

export default function ResultModal({ wpm, accuracy, errors, onSubmit, onDiscard, onRestart }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDiscard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDiscard]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="animate-pop w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center shadow-modal"
      >
        <h2 id="result-title" className="text-lg font-bold text-ink">
          Run complete
        </h2>

        <dl className="mt-4 grid grid-cols-3 gap-3">
          <Stat value={wpm} label="WPM" tone="text-accent" />
          <Stat value={`${accuracy}%`} label="Accuracy" tone="text-success" />
          <Stat value={errors} label="Errors" tone={errors > 0 ? 'text-danger' : 'text-ink'} />
        </dl>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label htmlFor="player-handle" className="sr-only">
            Your handle
          </label>
          <input
            id="player-handle"
            type="text"
            required
            autoFocus
            maxLength={18}
            autoComplete="nickname"
            placeholder="Enter handle (e.g. @dev)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="transition-ui h-10 w-full rounded-md border border-line-strong bg-canvas px-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <button
            type="submit"
            className="transition-ui h-10 w-full rounded-md bg-accent text-sm font-bold text-accent-ink hover:bg-accent-strong active:scale-[0.99]"
          >
            Claim Rank
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="transition-ui inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-line-strong text-sm text-ink-dim hover:bg-raised hover:text-ink active:scale-[0.99]"
          >
            <RotateCcw size={14} aria-hidden />
            Restart
          </button>
        </form>
      </div>
    </div>
  );
}
