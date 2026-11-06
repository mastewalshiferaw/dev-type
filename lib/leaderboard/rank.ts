import type { LeaderboardEntry, LeaderboardPage, LeaderboardQuery, RankedEntry, Timeframe } from './types';

const DAY = 24 * 60 * 60 * 1000;

export function timeframeStart(timeframe: Timeframe, now: number): number {
  if (timeframe === 'today') return now - DAY;
  if (timeframe === 'week') return now - 7 * DAY;
  return 0;
}

/**
 * Filter, keep each player's best score, then rank. Ties share a rank
 * (standard competition ranking: 1, 2, 2, 4).
 */
export function rankEntries(
  entries: readonly LeaderboardEntry[],
  query: LeaderboardQuery,
  now: number
): LeaderboardPage {
  const since = timeframeStart(query.timeframe, now);
  const best = new Map<string, LeaderboardEntry>();

  for (const entry of entries) {
    if (Date.parse(entry.createdAt) < since) continue;
    if (query.language !== 'all' && entry.language !== query.language) continue;

    // Deduplicate by player identity:
    // Every player gets ONE single entry representing their personal best score in this window.
    // If authenticated with a userId, key by userId. Otherwise, key by normalized username.
    const key = entry.userId ? `uid:${entry.userId}` : `name:${entry.username.trim().toLowerCase()}`;
    const current = best.get(key);
    if (
      !current ||
      entry.wpm > current.wpm ||
      (entry.wpm === current.wpm && entry.accuracy > current.accuracy)
    ) {
      best.set(key, entry);
    }
  }

  // Deduplicate by display username so identical usernames never appear multiple times
  // (e.g. if the same player submitted before and after logging in or across sessions)
  const byUsername = new Map<string, LeaderboardEntry>();
  for (const entry of best.values()) {
    const nameKey = entry.username.trim().toLowerCase();
    const existing = byUsername.get(nameKey);
    if (
      !existing ||
      entry.wpm > existing.wpm ||
      (entry.wpm === existing.wpm && entry.accuracy > existing.accuracy)
    ) {
      byUsername.set(nameKey, entry);
    }
  }

  const sorted = [...byUsername.values()].sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
  const ranked: RankedEntry[] = [];
  sorted.forEach((entry, index) => {
    const previous = ranked[index - 1];
    const tied = previous && previous.wpm === entry.wpm && previous.accuracy === entry.accuracy;
    ranked.push({ ...entry, rank: tied ? previous.rank : index + 1 });
  });

  const username = query.username?.trim().toLowerCase();
  const userId = query.userId;
  // Identity matching for "you":
  // 1. Authenticated users match strictly by userId first, or fallback to their username.
  // 2. Unauthenticated guests match by username.
  const you = userId
    ? (ranked.find((e) => e.userId === userId) ?? (username ? ranked.find((e) => e.username.trim().toLowerCase() === username) ?? null : null))
    : username
      ? (ranked.find((e) => e.username.trim().toLowerCase() === username) ?? null)
      : null;

  return {
    entries: ranked.slice(0, query.limit),
    totalCount: ranked.length,
    you,
  };
}
