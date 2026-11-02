import type { ScoreLanguage } from '@/lib/leaderboard/types';

export interface SampleLeader {
  username: string;
  wpm: number;
  accuracy: number;
  language: ScoreLanguage | 'all';
}

/**
 * Sample leaders for the marketing preview on the homepage.
 * Clearly marked with the "Sample" chip in UI.
 */
export const SAMPLE_LEADERS: readonly SampleLeader[] = [
  { username: 'syntax_fox', wpm: 142, accuracy: 98.8, language: 'rust' },
  { username: 'zero_byte', wpm: 135, accuracy: 99.1, language: 'typescript' },
  { username: 'dev_piper', wpm: 128, accuracy: 97.5, language: 'python' },
  { username: 'bit_runner', wpm: 121, accuracy: 98.2, language: 'go' },
  { username: 'null_check', wpm: 114, accuracy: 96.9, language: 'csharp' },
] as const;