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
    return Array.isArray(raw) ? raw : [];
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
    const entry: LeaderboardEntry = {
      ...score,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeSubmissions([...readSubmissions(), entry]);
    return entry;
  },
};
