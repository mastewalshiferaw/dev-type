'use client';

import { useMemo, useState } from 'react';
import { toDateKey, type UserPracticeLog } from '@/lib/logs';

interface Props {
  logs: UserPracticeLog[];
}

interface DayData {
  date: Date;
  dateKey: string;
  count: number;
  bestWpm: number;
  avgWpm: number;
}

interface WeekData {
  days: (DayData | null)[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ContributionGraph({ logs }: Props) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Group logs by dateKey
  const { weeks, monthLabels, totalInYear } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { weeks: [], monthLabels: [], totalInYear: 0 };
    }
    const logMap = new Map<string, { count: number; bestWpm: number; totalWpm: number }>();

    logs.forEach((log) => {
      const entry = logMap.get(log.dateKey) ?? { count: 0, bestWpm: 0, totalWpm: 0 };
      entry.count++;
      entry.bestWpm = Math.max(entry.bestWpm, log.wpm);
      entry.totalWpm += log.wpm;
      logMap.set(log.dateKey, entry);
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // GitHub grid: 52 weeks (approx 1 year), aligned to Sunday (day 0)
    const dayOfWeek = today.getDay(); // 0 (Sun) .. 6 (Sat)
    const totalDays = 52 * 7 + dayOfWeek + 1;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const generatedWeeks: WeekData[] = [];
    const generatedMonthLabels: { label: string; weekIndex: number }[] = [];
    let currentWeek: (DayData | null)[] = [];
    let lastMonth = -1;
    let yearTotal = 0;

    const cursor = new Date(startDate);
    while (cursor <= today) {
      const dKey = toDateKey(cursor);
      const logInfo = logMap.get(dKey);
      const count = logInfo?.count ?? 0;
      yearTotal += count;

      const dayData: DayData = {
        date: new Date(cursor),
        dateKey: dKey,
        count,
        bestWpm: logInfo?.bestWpm ?? 0,
        avgWpm: count > 0 ? Math.round(logInfo!.totalWpm / count) : 0,
      };

      currentWeek.push(dayData);

      // If week completed (7 days: Sun-Sat)
      if (currentWeek.length === 7) {
        generatedWeeks.push({ days: currentWeek });
        const month = currentWeek[0]?.date.getMonth();
        if (month !== undefined && month !== lastMonth) {
          generatedMonthLabels.push({
            label: MONTHS[month],
            weekIndex: generatedWeeks.length - 1,
          });
          lastMonth = month;
        }
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      generatedWeeks.push({ days: currentWeek });
    }

    return { weeks: generatedWeeks, monthLabels: generatedMonthLabels, totalInYear: yearTotal };
  }, [logs]);

  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-canvas border border-line-strong/40';
    if (count <= 2) return 'bg-accent/20 border border-accent/30';
    if (count <= 5) return 'bg-accent/45 border border-accent/55';
    if (count <= 8) return 'bg-accent/75 border border-accent/85';
    return 'bg-accent-fill border border-accent-fill shadow-xs';
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Commit & Practice Activity</h3>
          <p className="text-2xs text-muted">
            <strong className="text-ink tabular-nums">{totalInYear}</strong> practice contributions in the
            past 12 months
          </p>
        </div>

        {/* Level Legend */}
        <div className="flex items-center gap-1.5 text-2xs text-muted">
          <span>Less</span>
          <span className="size-2.5 rounded-xs border border-line-strong/40 bg-canvas" />
          <span className="size-2.5 rounded-xs border border-accent/30 bg-accent/20" />
          <span className="size-2.5 rounded-xs border border-accent/55 bg-accent/45" />
          <span className="size-2.5 rounded-xs border border-accent/85 bg-accent/75" />
          <span className="size-2.5 rounded-xs border border-accent-fill bg-accent-fill" />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="relative mt-4 overflow-x-auto pb-2">
        <div className="min-w-[720px] select-none">
          {/* Month Labels */}
          <div className="text-3xs relative mb-1 flex h-4 pl-8 font-medium text-muted">
            {monthLabels.map((m, idx) => (
              <span key={idx} className="absolute" style={{ left: `${m.weekIndex * 13 + 32}px` }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Weekday labels */}
            <div className="text-3xs flex w-7 shrink-0 flex-col justify-between py-0.5 pr-1 text-right font-medium text-muted">
              <span className="h-2.5 leading-none">Mon</span>
              <span className="h-2.5 leading-none">Wed</span>
              <span className="h-2.5 leading-none">Fri</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px]">
                  {week.days.map((day, dIdx) => {
                    if (!day) {
                      return <div key={dIdx} className="size-2.5 opacity-0" />;
                    }

                    return (
                      <div
                        key={day.dateKey}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`size-2.5 cursor-pointer rounded-xs transition-transform hover:z-10 hover:scale-125 ${getColorClass(
                          day.count
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Information Banner */}
      <div className="mt-2 flex min-h-6 items-center text-xs text-muted">
        {hoveredDay ? (
          <span className="flex items-center gap-2">
            <strong className="text-ink">
              {hoveredDay.count === 0
                ? 'No practice'
                : `${hoveredDay.count} ${hoveredDay.count === 1 ? 'practice run' : 'practice runs'}`}
            </strong>{' '}
            on{' '}
            {hoveredDay.date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            {hoveredDay.count > 0 && (
              <span className="text-ink-dim">
                (Avg: <span className="font-semibold text-accent">{hoveredDay.avgWpm} WPM</span>, Best:{' '}
                {hoveredDay.bestWpm} WPM)
              </span>
            )}
          </span>
        ) : (
          <span className="text-2xs text-muted/60">Hover over blocks to see daily activity</span>
        )}
      </div>
    </div>
  );
}
