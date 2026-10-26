'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  wpm: number;
  accuracy: number;
  onSubmit: (name: string) => void;
  onDiscard: () => void;
}

export default function ResultModal({ wpm, accuracy, onSubmit, onDiscard }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-sm w-full font-mono text-center shadow-2xl">
        <h2 className="text-lg font-bold text-zinc-100 mb-2">Run Completed!</h2>
        <div className="flex justify-center gap-6 my-4">
          <div>
            <div className="text-3xl font-extrabold text-amber-400">{wpm}</div>
            <div className="text-xs text-zinc-500 uppercase">WPM</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">{accuracy}%</div>
            <div className="text-xs text-zinc-500 uppercase">Accuracy</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            required
            autoFocus
            maxLength={18}
            placeholder="Enter handle (e.g. @dev)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="w-full bg-amber-400 text-zinc-950 font-bold py-2 rounded text-sm hover:bg-amber-300 transition"
          >
            Claim Rank
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="text-xs text-zinc-500 hover:text-zinc-400"
          >
            Skip
          </button>
        </form>
      </div>
    </div>
  );
}