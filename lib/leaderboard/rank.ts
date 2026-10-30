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
    const key = entry.username.toLowerCase();
    const current = best.get(key);
    if (
      !current ||
      entry.wpm > current.wpm ||
      (entry.wpm === current.wpm && entry.accuracy > current.accuracy)
    ) {
      best.set(key, entry);
    }
  }

  const sorted = [...best.values()].sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
  const ranked: RankedEntry[] = [];
  sorted.forEach((entry, index) => {
    const previous = ranked[index - 1];
    const tied = previous && previous.wpm === entry.wpm && previous.accuracy === entry.accuracy;
    ranked.push({ ...entry, rank: tied ? previous.rank : index + 1 });
  });

  const username = query.username?.toLowerCase();
  return {
    entries: ranked.slice(0, query.limit),
    you: username ? (ranked.find((e) => e.username.toLowerCase() === username) ?? null) : null,
  };
}
