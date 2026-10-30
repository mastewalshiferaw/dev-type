import type { ScoreLanguage } from '@/lib/leaderboard/types';

export interface SampleLeader {
  username: string;
  wpm: number;
  accuracy: number;
  language: ScoreLanguage | 'all';
}

/**
 * SAMPLE DATA for the static leaderboard preview. The handles match the mock leaderboard crowd
 * (lib/leaderboard/mock.ts), but these scores are fixed and do not come from real runs.
 */
export const SAMPLE_LEADERS: readonly SampleLeader[] = [
  { username: 'monad_mike', wpm: 128, accuracy: 98.4, language: 'mixed' },
  { username: 'async_ada', wpm: 121, accuracy: 97.9, language: 'html' },
  { username: 'vim_queen', wpm: 117, accuracy: 99.1, language: 'python' },
  { username: 'go_gopher', wpm: 109, accuracy: 96.7, language: 'all' },
  { username: 'sharp_shooter', wpm: 104, accuracy: 97.2, language: 'csharp' },
  { username: 'kernel_kat', wpm: 98, accuracy: 95.8, language: 'rust' },
] as const;
