import type { RunStats } from '@/lib/engine';
import type { RunLanguage } from '@/lib/snippets';
import { createLocalStore, useLocalStore } from '@/lib/store';

export const HISTORY_LIMIT = 20;

export interface RunRecord extends Omit<RunStats, 'correctChars' | 'incorrectChars'> {
  id: string;
  createdAt: number;
  language: RunLanguage;
  /** e.g. `time-30`, `lines-25`, `zen`, `custom` (see `modeKey`) */
  modeKey: string;
}

const isRecord = (value: unknown): value is RunRecord => {
  const r = value as RunRecord;
  return (
    !!r &&
    typeof r.id === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.wpm === 'number' &&
    typeof r.accuracy === 'number' &&
    typeof r.modeKey === 'string' &&
    typeof r.language === 'string'
  );
};

export const historyStore = createLocalStore<RunRecord[]>('devtype:history', [], (raw) =>
  Array.isArray(raw) ? raw.filter(isRecord).slice(0, HISTORY_LIMIT) : []
);

export const bestsStore = createLocalStore<Record<string, RunRecord>>('devtype:bests', {}, (raw) =>
  raw && typeof raw === 'object'
    ? Object.fromEntries(Object.entries(raw).filter(([, value]) => isRecord(value)))
    : {}
);

export const bestKey = (language: RunLanguage, modeKey: string) => `${language}:${modeKey}`;

export interface RecordOutcome {
  isPersonalBest: boolean;
  previousBest: RunRecord | null;
}

/** Save a run to history and update the personal best for its language and mode. */
export function recordRun(record: RunRecord): RecordOutcome {
  historyStore.set((prev) => [record, ...prev].slice(0, HISTORY_LIMIT));
  const key = bestKey(record.language, record.modeKey);
  const previousBest = bestsStore.get()[key] ?? null;
  const isPersonalBest = !previousBest || record.wpm > previousBest.wpm;
  if (isPersonalBest) bestsStore.set((prev) => ({ ...prev, [key]: record }));
  return { isPersonalBest, previousBest };
}

export function clearHistory() {
  historyStore.set([]);
  bestsStore.set({});
}

export function useHistory(): RunRecord[] {
  return useLocalStore(historyStore);
}

export function useBests(): Record<string, RunRecord> {
  return useLocalStore(bestsStore);
}
