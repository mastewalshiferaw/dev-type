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
    // Discard physically impossible or spoofed scores (DEV-002: strict 280 WPM human limit)
    if (entry.wpm > 280 || entry.wpm <= 0 || entry.accuracy > 100 || entry.accuracy < 0) {
      continue;
    }
    if (Date.parse(entry.createdAt) < since) continue;
    if (query.language !== 'all' && entry.language !== query.language) continue;

    // Deduplicate strictly by normalized username:
    // Every player gets ONE single entry representing their personal best score in this window.
    // Keying by username guarantees that identical names can NEVER appear multiple times on the leaderboard.
    const key = entry.username.trim().toLowerCase();
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

  const username = query.username?.trim().toLowerCase();
  const userId = query.userId;
  const isUuid = userId
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
    : false;

  // Strict identity matching for "you":
  // Authenticated user (valid UUID): ONLY matches entries where e.userId === userId.
  // Guest user (no UUID): ONLY matches unassigned guest entries (e.userId is undefined) where e.username matches.
  // An account can NEVER claim another player's score!
  const you = isUuid
    ? (ranked.find((e) => e.userId === userId) ?? null)
    : username
      ? (ranked.find((e) => !e.userId && e.username.trim().toLowerCase() === username) ?? null)
      : null;

  return {
    entries: ranked.slice(0, query.limit),
    totalCount: ranked.length,
    you,
  };
}
