import { type SupabaseClient } from '@supabase/supabase-js';
import { isLanguageId } from '@/lib/languages';
import { getSupabase } from '@/lib/supabase';
import { rankEntries, timeframeStart } from './rank';
import type { LeaderboardEntry, LeaderboardProvider, ScoreLanguage } from './types';

/**
 * Supabase adapter for the `scores` table. Expects the columns
 * id, player_name, wpm, accuracy, language, mode, created_at (see README for the migration).
 */

/** Rows fetched per query before de-duplicating to one score per player */
const FETCH_LIMIT = 500;

// Default to true (schema parity with migration 20261102000000); gracefully falls back to false if missing
let hasUserIdColumn = process.env.NEXT_PUBLIC_SUPABASE_SCORES_HAS_USER_ID !== 'false';

interface ScoreRow {
  id: string | number;
  user_id?: string | null;
  player_name: string;
  avatar_url?: string | null;
  telegram?: string | null;
  telegram_verified?: boolean | null;
  wpm: number;
  accuracy: number;
  language: string | null;
  mode: string | null;
  created_at: string;
}

function getClient(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not configured');
  return client;
}

const toEntry = (row: ScoreRow): LeaderboardEntry => ({
  id: String(row.id),
  userId: row.user_id ?? undefined,
  username: row.player_name,
  avatarUrl: row.avatar_url ?? undefined,
  telegram: row.telegram ?? undefined,
  telegramVerified: Boolean(row.telegram_verified),
  wpm: Math.round(row.wpm),
  accuracy: Number(row.accuracy),
  language: (isLanguageId(row.language?.toLowerCase())
    ? row.language!.toLowerCase()
    : 'mixed') as ScoreLanguage,
  modeKey: row.mode ?? 'time-30',
  createdAt: row.created_at,
});

export const supabaseProvider: LeaderboardProvider = {
  async list(query) {
    const now = Date.now();
    try {
      const runQuery = (withUserId: boolean, withSocials: boolean = true) => {
        const selectCols = withSocials
          ? withUserId
            ? 'id, user_id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram'
            : 'id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram'
          : withUserId
            ? 'id, user_id, player_name, wpm, accuracy, language, mode, created_at'
            : 'id, player_name, wpm, accuracy, language, mode, created_at';

        const req = getClient().from('scores').select(selectCols);

        let filtered = req
          .gte('created_at', new Date(timeframeStart(query.timeframe, now)).toISOString())
          .lte('wpm', 280)
          .gt('wpm', 0)
          .lte('accuracy', 100)
          .gte('accuracy', 0)
          .order('wpm', { ascending: false })
          .limit(FETCH_LIMIT);

        if (query.language !== 'all') {
          filtered = filtered.eq('language', query.language.toLowerCase());
        }
        return filtered;
      };

      let res = await runQuery(hasUserIdColumn, true);
      if (res.error && (res.error.code === '42703' || res.error.message.includes('column') || res.error.message.includes('schema cache'))) {
        // Fallback without social columns first
        res = await runQuery(hasUserIdColumn, false);
      }
      if (
        res.error &&
        hasUserIdColumn &&
        (res.error.code === '42703' ||
          res.error.message.includes('user_id') ||
          res.error.message.includes('schema cache'))
      ) {
        hasUserIdColumn = false;
        res = await runQuery(false, false);
      }

      if (res.error) {
        console.error('Leaderboard query error:', res.error.message);
        throw new Error('Unable to load leaderboard scores');
      }
      return rankEntries(((res.data ?? []) as unknown as ScoreRow[]).map(toEntry), query, now);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unable to load leaderboard scores') {
        console.error('Leaderboard fetch error:', err);
        throw new Error('Unable to load leaderboard scores');
      }
      throw err;
    }
  },

  async submit(score) {
    const client = getClient();
    const session = (await client.auth.getSession()).data.session;
    const token = session?.access_token;

    if (!token) {
      throw new Error('Please sign in to submit your score to the official leaderboard.');
    }

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(score),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit score');
    }

    return data.entry;
  },
};
