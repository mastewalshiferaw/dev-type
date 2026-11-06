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
      const runQuery = (withUserId: boolean) => {
        const req = withUserId
          ? getClient()
              .from('scores')
              .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at')
          : getClient().from('scores').select('id, player_name, wpm, accuracy, language, mode, created_at');

        let filtered = req
          .gte('created_at', new Date(timeframeStart(query.timeframe, now)).toISOString())
          .order('wpm', { ascending: false })
          .limit(FETCH_LIMIT);

        if (query.language !== 'all') {
          filtered = filtered.eq('language', query.language.toLowerCase());
        }
        return filtered;
      };

      let res = await runQuery(hasUserIdColumn);
      if (
        res.error &&
        hasUserIdColumn &&
        (res.error.code === '42703' ||
          res.error.message.includes('user_id') ||
          res.error.message.includes('schema cache'))
      ) {
        hasUserIdColumn = false;
        res = await runQuery(false);
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
    const rawUserId = session?.user?.id ?? score.userId ?? null;
    // user_id in Postgres references auth.users(id) and requires a valid UUID
    const isUuid = rawUserId
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId)
      : false;
    const userId = isUuid ? rawUserId : null;

    // Sanitize and enforce constraints (DEV-002)
    const cleanWpm = Math.min(400, Math.max(0, Math.round(score.wpm)));
    const cleanAccuracy = Math.min(100, Math.max(0, Number(score.accuracy.toFixed(2))));
    const cleanName = score.username.trim().slice(0, 18);
    const cleanLang = (score.language || 'mixed').toLowerCase();
    const cleanMode = (score.modeKey || 'time-30').slice(0, 30);

    const basePayload = {
      player_name: cleanName,
      wpm: cleanWpm,
      accuracy: cleanAccuracy,
      language: cleanLang,
      mode: cleanMode,
    };

    const payload = hasUserIdColumn && userId ? { ...basePayload, user_id: userId } : basePayload;

    let res = hasUserIdColumn
      ? await client
          .from('scores')
          .insert(payload)
          .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at')
          .single()
      : await client
          .from('scores')
          .insert(basePayload)
          .select('id, player_name, wpm, accuracy, language, mode, created_at')
          .single();

    if (
      res.error &&
      hasUserIdColumn &&
      (res.error.code === '42703' ||
        res.error.message.includes('user_id') ||
        res.error.message.includes('schema cache'))
    ) {
      hasUserIdColumn = false;
      res = await client
        .from('scores')
        .insert(basePayload)
        .select('id, player_name, wpm, accuracy, language, mode, created_at')
        .single();
    }

    if (res.error) {
      console.error('Score submission error:', res.error.message);
      throw new Error('Could not submit score to leaderboard');
    }
    return toEntry(res.data as unknown as ScoreRow);
  },
};
