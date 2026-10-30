import type { LanguageFilter, LanguageId } from '@/lib/languages';

export type Timeframe = 'today' | 'week' | 'all';
export type ScoreLanguage = LanguageId | 'mixed';

export const TIMEFRAMES: readonly { value: Timeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'all', label: 'All time' },
];

export interface LeaderboardEntry {
  id: string;
  username: string;
  wpm: number;
  accuracy: number;
  language: ScoreLanguage;
  modeKey: string;
  createdAt: string;
}

export interface RankedEntry extends LeaderboardEntry {
  rank: number;
}

export interface LeaderboardQuery {
  timeframe: Timeframe;
  language: LanguageFilter;
  limit: number;
  /** When set, the page also reports this user's best ranked entry */
  username?: string;
}

export interface LeaderboardPage {
  entries: RankedEntry[];
  you: RankedEntry | null;
}

export type ScoreSubmission = Omit<LeaderboardEntry, 'id' | 'createdAt'>;

/**
 * Anything that can store and rank scores. The app only talks to this interface, so the mock
 * can be swapped for a real backend without touching components.
 */
export interface LeaderboardProvider {
  list(query: LeaderboardQuery): Promise<LeaderboardPage>;
  submit(score: ScoreSubmission): Promise<LeaderboardEntry>;
}
