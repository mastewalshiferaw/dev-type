import { LANGUAGE_IDS } from '@/lib/languages';
import { rankEntries } from './rank';
import type { LeaderboardEntry, LeaderboardProvider, ScoreLanguage, ScoreSubmission } from './types';

/**
 * In-browser mock backend: a seeded crowd of players plus your own submissions (kept in
 * localStorage). Responses are delayed slightly so loading states are exercised.
 */

const STORAGE_KEY = 'devtype:mock-scores';
const LATENCY_MS = 350;
const DAY = 24 * 60 * 60 * 1000;

const HANDLES = [
  'null_pointer',
  'segfault_sam',
  'rustacean',
  'async_ada',
  'kernel_kat',
  'git_gud',
  'vim_queen',
  'tabs_not_spaces',
  'monad_mike',
  'byte_bandit',
  'lambda_lou',
  'docker_dan',
  'regex_rita',
  'off_by_one',
  'heap_hero',
  'cache_miss',
  'sudo_sue',
  'pixel_pete',
  'stack_smash',
  'go_gopher',
  'type_tyrant',
  'bash_brawler',
  'css_wizard',
  'sql_injector',
  'kotlin_kid',
  'swift_sam',
  'ruby_red',
  'php_phil',
  'java_jules',
  'sharp_shooter',
];

/** Small deterministic PRNG so the mock crowd looks the same on every load. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededCrowd(now: number): LeaderboardEntry[] {
  const rand = mulberry32(1337);
  const languages: ScoreLanguage[] = [...LANGUAGE_IDS, 'mixed'];
  const entries: LeaderboardEntry[] = [];
  HANDLES.forEach((username, player) => {
    const skill = 45 + rand() * 75;
    const runs = 3 + Math.floor(rand() * 6);
    for (let run = 0; run < runs; run++) {
      // Skew towards recent activity so "Today" is never empty
      const age = run === 0 ? rand() * 20 * 60 * 60 * 1000 : rand() ** 2 * 45 * DAY;
      entries.push({
        id: `seed-${player}-${run}`,
        username,
        wpm: Math.round(skill + (rand() - 0.5) * 20),
        accuracy: Math.round((88 + rand() * 12) * 10) / 10,
        language: languages[Math.floor(rand() * languages.length)],
        modeKey: rand() > 0.3 ? 'time-30' : 'time-60',
        createdAt: new Date(now - age).toISOString(),
      });
    }
  });
  return entries;
}

function readSubmissions(): LeaderboardEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeSubmissions(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-200)));
  } catch {
    // Storage blocked: submissions last for this page only
  }
}

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

let crowd: LeaderboardEntry[] | null = null;

export const mockProvider: LeaderboardProvider = {
  async list(query) {
    await delay();
    const now = Date.now();
    crowd ??= seededCrowd(now);
    return rankEntries([...crowd, ...readSubmissions()], query, now);
  },

  async submit(score: ScoreSubmission) {
    await delay();
    const entry: LeaderboardEntry = {
      ...score,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeSubmissions([...readSubmissions(), entry]);
    return entry;
  },
};
