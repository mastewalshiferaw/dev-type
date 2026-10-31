import { toDateKey, type UserPracticeLog } from '@/lib/logs';

export interface StreakInfo {
  /** The current active streak in days */
  currentStreak: number;
  /** Longest streak ever achieved */
  bestStreak: number;
  /** Whether the user completed at least one practice run today (fire is lit) */
  isPracticedToday: boolean;
  /** Total number of unique days the user has practiced */
  totalActiveDays: number;
  /** Most recent date practiced (YYYY-MM-DD) */
  lastPracticedDate: string | null;
  /** Monday to Sunday completion flags for the current week */
  weeklyDays: {
    dayLabel: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
    dateKey: string;
    isCompleted: boolean;
    isToday: boolean;
    isFuture: boolean;
  }[];
}

const DEFAULT_WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label) => ({
  dayLabel: label,
  dateKey: '',
  isCompleted: false,
  isToday: false,
  isFuture: false,
}));

/**
 * Calculates Duolingo-style streak information from user practice logs.
 */
export function calculateStreak(logs: UserPracticeLog[]): StreakInfo {
  if (typeof window === 'undefined' || !logs || logs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      isPracticedToday: false,
      totalActiveDays: 0,
      lastPracticedDate: null,
      weeklyDays: DEFAULT_WEEK_DAYS,
    };
  }

  // Set of unique date keys (YYYY-MM-DD)
  const activeDateSet = new Set<string>();
  logs.forEach((log) => {
    if (log.dateKey) activeDateSet.add(log.dateKey);
  });

  const now = new Date();
  const todayKey = toDateKey(now);
  const yesterdayKey = toDateKey(new Date(now.getTime() - 86400000));

  const isPracticedToday = activeDateSet.has(todayKey);

  // 1. Calculate current streak
  let currentStreak = 0;
  let checkDate = isPracticedToday ? new Date(now.getTime()) : new Date(now.getTime() - 86400000);

  // If not practiced today, and also didn't practice yesterday, streak is broken
  if (!isPracticedToday && !activeDateSet.has(yesterdayKey)) {
    currentStreak = 0;
  } else {
    while (true) {
      const key = toDateKey(checkDate);
      if (activeDateSet.has(key)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
  }

  // 2. Calculate best streak across all time
  const sortedDays = Array.from(activeDateSet).sort();
  let bestStreak = currentStreak;
  let runningStreak = 0;
  let previousDate: Date | null = null;

  for (const dateStr of sortedDays) {
    const parts = dateStr.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

    if (!previousDate) {
      runningStreak = 1;
    } else {
      const diffMs = dateObj.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffMs / 86400000);

      if (diffDays === 1) {
        runningStreak++;
      } else if (diffDays > 1) {
        runningStreak = 1;
      }
    }

    if (runningStreak > bestStreak) {
      bestStreak = runningStreak;
    }

    previousDate = dateObj;
  }

  const lastPracticedDate = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;

  return {
    currentStreak,
    bestStreak,
    isPracticedToday,
    totalActiveDays: activeDateSet.size,
    lastPracticedDate,
    weeklyDays: getWeekDays(activeDateSet),
  };
}

function getWeekDays(activeSet: Set<string>) {
  if (typeof window === 'undefined') return DEFAULT_WEEK_DAYS;

  const now = new Date();
  const todayKey = toDateKey(now);

  // JavaScript getDay(): 0 is Sunday, 1 is Monday...
  const dayOfWeek = now.getDay();
  // We want Monday = 0, ..., Sunday = 6
  const monOffset = (dayOfWeek + 6) % 7;

  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const weekDays = [];

  const monday = new Date(now);
  monday.setDate(now.getDate() - monOffset);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const key = toDateKey(day);

    const isToday = key === todayKey;
    const isFuture = day.getTime() > now.getTime() && !isToday;
    const isCompleted = activeSet.has(key);

    weekDays.push({
      dayLabel: labels[i],
      dateKey: key,
      isCompleted,
      isToday,
      isFuture,
    });
  }

  return weekDays;
}
