export type FeatureId = 'snippets' | 'modes' | 'stats' | 'leaderboard' | 'keyboard' | 'themes';

export interface Feature {
  id: FeatureId;
  title: string;
  description: string;
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'snippets',
    title: 'Real code, not random words',
    description:
      'Hand-written snippets with real syntax, real indentation and real comments (skippable). Short, medium or long, in every language.',
  },
  {
    id: 'modes',
    title: 'Four ways to type',
    description:
      'Race the clock for 15 to 120 seconds, finish 10 to 50 lines, type without limits in Zen, or paste your own code.',
  },
  {
    id: 'stats',
    title: 'Stats that explain the number',
    description:
      'WPM, raw WPM, accuracy, consistency and a per-second chart with every error, so you can see where the time went.',
  },
  {
    id: 'leaderboard',
    title: 'A leaderboard that resets daily',
    description:
      'The 24-hour sprint keeps #1 within reach. Weekly and all-time boards too, filterable by language.',
  },
  {
    id: 'keyboard',
    title: 'Hands stay on the keyboard',
    description:
      'Tab restarts, the command palette reaches every setting, and a shortcut flips the theme. The mouse is optional.',
  },
  {
    id: 'themes',
    title: 'Feels like your editor',
    description:
      'Light and dark themes that follow your system, line, block or underline carets, three code fonts and optional ligatures.',
  },
];
