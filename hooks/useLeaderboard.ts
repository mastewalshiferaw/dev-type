'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getLeaderboard,
  type LeaderboardEntry,
  type LeaderboardPage,
  type LeaderboardQuery,
  type ScoreSubmission,
} from '@/lib/leaderboard';

const POLL_MS = 30_000;

// Lets a submission anywhere in the app refresh every mounted leaderboard
const listeners = new Set<() => void>();

export async function submitScore(score: ScoreSubmission): Promise<LeaderboardEntry> {
  const provider = await getLeaderboard();
  const entry = await provider.submit(score);
  listeners.forEach((listener) => listener());
  return entry;
}

interface Result {
  key: string;
  page?: LeaderboardPage;
  error?: string;
  updatedAt?: number;
}

/** Live leaderboard: loads on filter change, polls while the tab is visible, refreshes on submit. */
export function useLeaderboard(query: LeaderboardQuery) {
  const key = JSON.stringify(query);
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const parsed = JSON.parse(key) as LeaderboardQuery;
    let cancelled = false;

    const load = () => {
      getLeaderboard()
        .then((provider) => provider.list(parsed))
        .then(
          (page) => !cancelled && setResult({ key, page, updatedAt: Date.now() }),
          (error: unknown) =>
            !cancelled &&
            setResult({
              key,
              error: error instanceof Error ? error.message : 'Could not load the leaderboard',
            })
        );
    };

    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    listeners.add(load);
    return () => {
      cancelled = true;
      clearInterval(id);
      listeners.delete(load);
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);
  const current = result?.key === key ? result : null;

  return {
    page: current?.page ?? null,
    error: current?.error ?? null,
    loading: !current,
    updatedAt: current?.updatedAt ?? null,
    retry,
  };
}
