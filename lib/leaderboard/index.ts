import type { LeaderboardProvider } from './types';

export * from './types';

/**
 * Pick the backend once. Set NEXT_PUBLIC_LEADERBOARD_PROVIDER=supabase to use the real table;
 * anything else uses the in-browser mock. Adapters are loaded lazily so the unused one never ships.
 */
let provider: Promise<LeaderboardProvider> | null = null;

export function getLeaderboard(): Promise<LeaderboardProvider> {
  const shouldUseSupabase =
    process.env.NEXT_PUBLIC_LEADERBOARD_PROVIDER === 'supabase' ||
    (process.env.NEXT_PUBLIC_LEADERBOARD_PROVIDER !== 'mock' && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));

  provider ??= shouldUseSupabase
    ? import('./supabase').then((m) => m.supabaseProvider)
    : import('./mock').then((m) => m.mockProvider);
  return provider;
}
