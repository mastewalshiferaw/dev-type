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

// Lets a submission or profile update anywhere in the app refresh every mounted leaderboard
const listeners = new Set<() => void>();

export function refreshLeaderboard(): void {
  listeners.forEach((listener) => listener());
}

export async function submitScore(score: ScoreSubmission): Promise<LeaderboardEntry> {
  const provider = await getLeaderboard();
  const entry = await provider.submit(score);
  refreshLeaderboard();
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
    let timeoutId: NodeJS.Timeout | null = null;
    let pollInterval = POLL_MS;

    const load = () => {
      getLeaderboard()
        .then((provider) => provider.list(parsed))
        .then(
          (page) => {
            if (!cancelled) {
              pollInterval = POLL_MS; // reset on success
              setResult({ key, page, updatedAt: Date.now() });
              scheduleNext();
            }
          },
          () => {
            if (!cancelled) {
              // Back off on error (DEV-020) up to 2 minutes
              pollInterval = Math.min(pollInterval * 2, 120_000);
              setResult({
                key,
                error: 'Could not load the leaderboard. Retrying shortly.',
              });
              scheduleNext();
            }
          }
        );
    };

    const scheduleNext = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!cancelled && typeof document !== 'undefined' && document.visibilityState === 'visible') {
          load();
        } else if (!cancelled) {
          scheduleNext();
        }
      }, pollInterval);
    };

    load();

    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);

    listeners.add(load);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisible);
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
