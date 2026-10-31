import { createLocalStore, useLocalStore } from '@/lib/store';
import { historyStore, type RunRecord } from '@/lib/history';
import { getSupabase } from '@/lib/supabase';

export interface UserPracticeLog {
  id: string;
  userId?: string;
  createdAt: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  durationMs: number;
  language: string;
  modeKey: string;
  dateKey: string; // YYYY-MM-DD in local time
}

const LOGS_STORAGE_KEY = 'devtype:practice_logs';
const MAX_LOCAL_LOGS = 2000;

export function toDateKey(dateOrTimestamp: Date | number = new Date()): string {
  const d = typeof dateOrTimestamp === 'number' ? new Date(dateOrTimestamp) : dateOrTimestamp;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const isValidLog = (item: unknown): item is UserPracticeLog => {
  const log = item as UserPracticeLog;
  return (
    !!log &&
    typeof log.id === 'string' &&
    typeof log.createdAt === 'number' &&
    typeof log.wpm === 'number' &&
    typeof log.accuracy === 'number' &&
    typeof log.language === 'string' &&
    typeof log.dateKey === 'string'
  );
};

export const practiceLogsStore = createLocalStore<UserPracticeLog[]>(LOGS_STORAGE_KEY, [], (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidLog).slice(0, MAX_LOCAL_LOGS);
});

let isSeeded = false;

/**
 * Ensures any historical runs in historyStore are migrated into practiceLogsStore
 */
export function ensureLogsMigrated() {
  if (isSeeded || typeof window === 'undefined') return;
  isSeeded = true;

  const currentLogs = practiceLogsStore.get();
  if (currentLogs.length === 0) {
    const historicalRuns = historyStore.get();
    if (historicalRuns.length > 0) {
      const migrated: UserPracticeLog[] = historicalRuns.map((run: RunRecord) => ({
        id: run.id,
        createdAt: run.createdAt,
        wpm: run.wpm,
        rawWpm: run.raw ?? run.wpm,
        accuracy: run.accuracy,
        consistency: run.consistency ?? 100,
        durationMs: run.durationMs ?? 30000,
        language: run.language,
        modeKey: run.modeKey,
        dateKey: toDateKey(run.createdAt),
      }));
      practiceLogsStore.set(migrated);
    }
  }
}

/**
 * Add a completed practice run to user logs.
 */
export function addPracticeLog(entry: {
  userId?: string;
  wpm: number;
  rawWpm?: number;
  raw?: number;
  accuracy: number;
  consistency?: number | null;
  durationMs: number;
  language: string;
  modeKey: string;
  createdAt?: number;
}): UserPracticeLog {
  const now = entry.createdAt ?? Date.now();
  const rawValue = entry.rawWpm ?? entry.raw ?? entry.wpm;
  const consistencyValue = entry.consistency ?? 100;
  const newLog: UserPracticeLog = {
    id: crypto.randomUUID(),
    userId: entry.userId,
    createdAt: now,
    wpm: Math.round(entry.wpm),
    rawWpm: Math.round(rawValue),
    accuracy: Math.round(entry.accuracy),
    consistency: Math.round(consistencyValue),
    durationMs: Math.round(entry.durationMs),
    language: entry.language,
    modeKey: entry.modeKey,
    dateKey: toDateKey(now),
  };

  practiceLogsStore.set((prev) => [newLog, ...prev].slice(0, MAX_LOCAL_LOGS));

  // If user is connected to Supabase and scores table is active, try to submit or sync in background
  trySyncRemote(newLog);

  return newLog;
}

async function trySyncRemote(log: UserPracticeLog) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Try inserting into user_logs if table exists
    await supabase.from('user_logs').insert({
      id: log.id,
      user_id: session.user.id,
      wpm: log.wpm,
      accuracy: log.accuracy,
      language: log.language,
      mode: log.modeKey,
      duration_ms: log.durationMs,
      created_at: new Date(log.createdAt).toISOString(),
    });
  } catch {
    // Ignore schema missing error; local store is the primary truth
  }
}

export function usePracticeLogs(): UserPracticeLog[] {
  ensureLogsMigrated();
  return useLocalStore(practiceLogsStore);
}

export interface LanguageStat {
  language: string;
  runs: number;
  totalDurationMs: number;
  averageWpm: number;
  averageAccuracy: number;
  percentage: number;
}

export function computeLanguageDistribution(logs: UserPracticeLog[], days?: number): LanguageStat[] {
  const minTime = days ? Date.now() - days * 86400000 : 0;
  const filtered = days ? logs.filter((l) => l.createdAt >= minTime) : logs;

  if (filtered.length === 0) return [];

  const map = new Map<string, { runs: number; durationMs: number; wpmSum: number; accSum: number }>();

  filtered.forEach((log) => {
    const key = log.language || 'mixed';
    const curr = map.get(key) ?? { runs: 0, durationMs: 0, wpmSum: 0, accSum: 0 };
    curr.runs += 1;
    curr.durationMs += log.durationMs;
    curr.wpmSum += log.wpm;
    curr.accSum += log.accuracy;
    map.set(key, curr);
  });

  const totalRuns = filtered.length;

  return Array.from(map.entries())
    .map(([language, data]) => ({
      language,
      runs: data.runs,
      totalDurationMs: data.durationMs,
      averageWpm: Math.round(data.wpmSum / data.runs),
      averageAccuracy: Math.round(data.accSum / data.runs),
      percentage: Math.round((data.runs / totalRuns) * 100),
    }))
    .sort((a, b) => b.runs - a.runs);
}

export interface DailyLanguagePoint {
  dateKey: string;
  displayDate: string;
  totalRuns: number;
  [language: string]: number | string;
}

export function computeDailyLanguageTrend(logs: UserPracticeLog[], daysCount = 14): DailyLanguagePoint[] {
  if (typeof window === 'undefined' || !logs || logs.length === 0) return [];
  const result: DailyLanguagePoint[] = [];
  const now = new Date();

  // Find top 4 languages across all logs to chart individually; others go into "other"
  const topLanguages = computeLanguageDistribution(logs)
    .slice(0, 4)
    .map((l) => l.language);

  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dateKey = toDateKey(date);
    const dayLogs = logs.filter((l) => l.dateKey === dateKey);

    const point: DailyLanguagePoint = {
      dateKey,
      displayDate: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      totalRuns: dayLogs.length,
    };

    topLanguages.forEach((lang) => {
      point[lang] = dayLogs.filter((l) => l.language === lang).length;
    });

    const otherRuns = dayLogs.filter((l) => !topLanguages.includes(l.language)).length;
    if (otherRuns > 0) {
      point['other'] = otherRuns;
    }

    result.push(point);
  }

  return result;
}
