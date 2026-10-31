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

interface ScoreRow {
  id: string | number;
  player_name: string;
  wpm: number;
  accuracy: number;
  language: string | null;
  mode: string | null;
  created_at: string;
}

function getClient(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('Supabase URL and anon key are not configured');
  return client;
}

const toEntry = (row: ScoreRow): LeaderboardEntry => ({
  id: String(row.id),
  username: row.player_name,
  wpm: row.wpm,
  accuracy: row.accuracy,
  language: (isLanguageId(row.language) ? row.language : 'mixed') as ScoreLanguage,
  modeKey: row.mode ?? 'time-30',
  createdAt: row.created_at,
});

export const supabaseProvider: LeaderboardProvider = {
  async list(query) {
    const now = Date.now();
    let request = getClient()
      .from('scores')
      .select('id, player_name, wpm, accuracy, language, mode, created_at')
      .gte('created_at', new Date(timeframeStart(query.timeframe, now)).toISOString())
      .order('wpm', { ascending: false })
      .limit(FETCH_LIMIT);
    if (query.language !== 'all') request = request.eq('language', query.language);

    const { data, error } = await request;
    if (error) throw new Error(error.message);
    return rankEntries((data as ScoreRow[]).map(toEntry), query, now);
  },

  async submit(score) {
    const { data, error } = await getClient()
      .from('scores')
      .insert({
        player_name: score.username,
        wpm: score.wpm,
        accuracy: score.accuracy,
        language: score.language,
        mode: score.modeKey,
      })
      .select('id, player_name, wpm, accuracy, language, mode, created_at')
      .single();
    if (error) throw new Error(error.message);
    return toEntry(data as ScoreRow);
  },
};
