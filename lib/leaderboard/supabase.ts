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
    const rawUserId = session?.user?.id ?? score.userId ?? null;
    // user_id in Postgres references auth.users(id) and requires a valid UUID
    const isUuid = rawUserId
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId)
      : false;
    const userId = isUuid ? rawUserId : null;

    // Sanitize and enforce constraints (DEV-002: tough anti-cheat boundaries)
    const MAX_WPM = 280;
    if (score.wpm > MAX_WPM || score.wpm <= 0 || score.accuracy > 100 || score.accuracy < 0) {
      throw new Error('Score rejected: stats are outside valid human limits.');
    }
    const cleanWpm = Math.min(MAX_WPM, Math.max(1, Math.round(score.wpm)));
    const cleanAccuracy = Math.min(100, Math.max(0, Number(score.accuracy.toFixed(2))));
    const cleanName = score.username.trim().slice(0, 24);
    const cleanLang = (score.language || 'mixed').toLowerCase();
    const cleanMode = (score.modeKey || 'time-30').slice(0, 30);

    const cleanAvatar = score.avatarUrl ? score.avatarUrl.trim().slice(0, 2048) : undefined;
    const cleanTelegram = score.telegram ? score.telegram.trim().replace(/^@/, '').slice(0, 50) : undefined;

    const basePayload = {
      player_name: cleanName,
      wpm: cleanWpm,
      accuracy: cleanAccuracy,
      language: cleanLang,
      mode: cleanMode,
      ...(cleanAvatar ? { avatar_url: cleanAvatar } : {}),
      ...(cleanTelegram ? { telegram: cleanTelegram } : {}),
    };

    const payload = hasUserIdColumn && userId ? { ...basePayload, user_id: userId } : basePayload;

    // 1. Check if a score entry already exists for this player or user
    try {
      let existingQuery = client
        .from('scores')
        .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at, avatar_url, telegram');

      if (hasUserIdColumn && userId) {
        existingQuery = existingQuery.or(`user_id.eq.${userId},player_name.eq.${cleanName}`);
      } else {
        existingQuery = existingQuery.eq('player_name', cleanName);
      }

      const { data: existingRows, error: findError } = await existingQuery.limit(1);

      if (!findError && existingRows && existingRows.length > 0) {
        const existing = existingRows[0] as unknown as ScoreRow;
        // Keep personal best WPM and accuracy; update stats if new score beats or matches it
        const isBetter =
          cleanWpm > existing.wpm || (cleanWpm === existing.wpm && cleanAccuracy >= existing.accuracy);

        const updateData = isBetter
          ? {
              ...payload,
              created_at: new Date().toISOString(),
            }
          : {
              created_at: new Date().toISOString(),
              ...(cleanAvatar ? { avatar_url: cleanAvatar } : {}),
              ...(cleanTelegram ? { telegram: cleanTelegram } : {}),
              ...(hasUserIdColumn && userId && !existing.user_id ? { user_id: userId } : {}),
            };

        const updateRes = await client
          .from('scores')
          .update(updateData)
          .eq('id', existing.id)
          .select(
            hasUserIdColumn
              ? 'id, user_id, player_name, wpm, accuracy, language, mode, created_at'
              : 'id, player_name, wpm, accuracy, language, mode, created_at'
          )
          .single();

        if (!updateRes.error && updateRes.data) {
          return toEntry(updateRes.data as unknown as ScoreRow);
        }
      }
    } catch {
      // Continue to upsert fallback if lookup fails
    }

    // 2. Insert new entry if player does not exist yet (upsert on player_name to avoid duplicates)
    const insertPayload = {
      ...payload,
      created_at: new Date().toISOString(),
    };

    let res = hasUserIdColumn
      ? await client
          .from('scores')
          .upsert(insertPayload, { onConflict: 'player_name' })
          .select('id, user_id, player_name, wpm, accuracy, language, mode, created_at')
          .single()
      : await client
          .from('scores')
          .upsert(basePayload, { onConflict: 'player_name' })
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
        .upsert(basePayload, { onConflict: 'player_name' })
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
