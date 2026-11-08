import { rankEntries } from './rank';
import type { LeaderboardEntry, LeaderboardProvider, ScoreSubmission } from './types';

/**
 * Clean local provider: only stores and displays REAL submissions (kept in localStorage).
 * No fake users or seeded mock data.
 */

const STORAGE_KEY = 'devtype:scores';
const LATENCY_MS = 200;

function readSubmissions(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (e) =>
        typeof e === 'object' &&
        e !== null &&
        typeof e.wpm === 'number' &&
        e.wpm > 0 &&
        e.wpm <= 350 &&
        typeof e.accuracy === 'number' &&
        e.accuracy >= 0 &&
        e.accuracy <= 100
    );
  } catch {
    return [];
  }
}

function writeSubmissions(entries: LeaderboardEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-200)));
  } catch {
    // Storage blocked or full
  }
}

const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

export const mockProvider: LeaderboardProvider = {
  async list(query) {
    await delay();
    const now = Date.now();
    // Only real submissions from actual typing runs:
    return rankEntries(readSubmissions(), query, now);
  },

  async submit(score: ScoreSubmission) {
    await delay();
    if (score.wpm > 280 || score.wpm <= 0 || score.accuracy > 100 || score.accuracy < 0) {
      throw new Error('Score rejected: stats are outside valid human limits.');
    }
    const cleanWpm = Math.min(280, Math.max(1, Math.round(score.wpm)));
    const cleanAccuracy = Math.min(100, Math.max(0, Number(score.accuracy.toFixed(2))));
    const entry: LeaderboardEntry = {
      ...score,
      wpm: cleanWpm,
      accuracy: cleanAccuracy,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeSubmissions([...readSubmissions(), entry]);
    return entry;
  },
};
