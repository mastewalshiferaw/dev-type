import type { ScoreLanguage } from '@/lib/leaderboard/types';

export interface SampleLeader {
  username: string;
  wpm: number;
  accuracy: number;
  language: ScoreLanguage | 'all';
}

/**
 * Empty by default for fresh production launch.
 * Real scores from Supabase will populate here.
 */
export const SAMPLE_LEADERS: readonly SampleLeader[] = [] as const;