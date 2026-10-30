import type { LeaderboardProvider } from './types';

export * from './types';

/**
 * Pick the backend once. Set NEXT_PUBLIC_LEADERBOARD_PROVIDER=supabase to use the real table;
 * anything else uses the in-browser mock. Adapters are loaded lazily so the unused one never ships.
 */
let provider: Promise<LeaderboardProvider> | null = null;

export function getLeaderboard(): Promise<LeaderboardProvider> {
  provider ??=
    process.env.NEXT_PUBLIC_LEADERBOARD_PROVIDER === 'supabase'
      ? import('./supabase').then((m) => m.supabaseProvider)
      : import('./mock').then((m) => m.mockProvider);
  return provider;
}
