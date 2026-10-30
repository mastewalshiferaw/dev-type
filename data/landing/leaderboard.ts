/**
 * SAMPLE DATA for the static leaderboard preview. The handles match the mock leaderboard crowd
 * (lib/leaderboard/mock.ts), but these scores are fixed and do not come from real runs.
 */
export const SAMPLE_LEADERS = [
  { username: 'monad_mike', wpm: 128, accuracy: 98.4 },
  { username: 'async_ada', wpm: 121, accuracy: 97.9 },
  { username: 'vim_queen', wpm: 117, accuracy: 99.1 },
  { username: 'go_gopher', wpm: 109, accuracy: 96.7 },
  { username: 'sharp_shooter', wpm: 104, accuracy: 97.2 },
  { username: 'kernel_kat', wpm: 98, accuracy: 95.8 },
] as const;
