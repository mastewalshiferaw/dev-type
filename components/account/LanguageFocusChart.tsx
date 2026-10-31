'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import { leaderboardLanguageLabel } from '@/lib/languages';
import { computeDailyLanguageTrend, computeLanguageDistribution, type UserPracticeLog } from '@/lib/logs';

interface Props {
  logs: UserPracticeLog[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#eab308',
  python: '#38bdf8',
  rust: '#f97316',
  go: '#06b6d4',
  cpp: '#ec4899',
  csharp: '#22c55e',
  java: '#d97706',
  kotlin: '#a855f7',
  php: '#818cf8',
  ruby: '#ef4444',
  swift: '#f43f5e',
  sql: '#f59e0b',
  html: '#fb923c',
  bash: '#84cc16',
  mixed: '#a1a1aa',
  other: '#71717a',
};

function FocusTooltip({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border border-line-strong bg-surface p-2.5 text-xs shadow-modal">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          if (!entry.value || Number(entry.value) === 0) return null;
          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-ink-dim">
                <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {leaderboardLanguageLabel(String(entry.name))}
              </span>
              <span className="font-bold text-ink tabular-nums">{entry.value} runs</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LanguageFocusChart({ logs }: Props) {
  const [daysWindow, setDaysWindow] = useState<14 | 30>(14);

  const distribution = useMemo(() => computeLanguageDistribution(logs, daysWindow), [logs, daysWindow]);
  const trendData = useMemo(() => computeDailyLanguageTrend(logs, daysWindow), [logs, daysWindow]);

  const topLanguages = useMemo(() => distribution.slice(0, 4).map((d) => d.language), [distribution]);

  const primaryLanguage = distribution[0];

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 text-center">
        <h3 className="text-sm font-bold text-ink">Language Focus Over Time</h3>
        <p className="mt-2 text-xs text-muted">
          Complete a few typing runs to see your language focus trends.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Language Focus Over Time</h3>
          <p className="text-2xs text-muted">
            {primaryLanguage ? (
              <>
                Main focus:{' '}
                <strong className="text-ink">{leaderboardLanguageLabel(primaryLanguage.language)}</strong> (
                <span className="font-semibold text-accent">{primaryLanguage.percentage}%</span> of your
                practice)
              </>
            ) : (
              'Tracking your programming focus'
            )}
          </p>
        </div>

        {/* Timeframe switch */}
        <div className="flex rounded-md border border-line bg-canvas p-0.5 text-2xs">
          <button
            type="button"
            onClick={() => setDaysWindow(14)}
            className={`rounded px-2.5 py-1 font-semibold transition-ui ${
              daysWindow === 14 ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
            }`}
          >
            14 Days
          </button>
          <button
            type="button"
            onClick={() => setDaysWindow(30)}
            className={`rounded px-2.5 py-1 font-semibold transition-ui ${
              daysWindow === 30 ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* GitHub-style distribution progress bar */}
      <div className="mt-4">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-canvas">
          {distribution.map((item) => (
            <div
              key={item.language}
              style={{
                width: `${Math.max(item.percentage, 2)}%`,
                backgroundColor: LANGUAGE_COLORS[item.language] ?? '#888',
              }}
              title={`${leaderboardLanguageLabel(item.language)}: ${item.percentage}%`}
              className="h-full transition-all duration-300"
            />
          ))}
        </div>

        {/* Legend dots */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {distribution.slice(0, 6).map((item) => (
            <div key={item.language} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: LANGUAGE_COLORS[item.language] ?? '#888' }}
              />
              <span className="font-medium text-ink">{leaderboardLanguageLabel(item.language)}</span>
              <span className="text-2xs text-muted tabular-nums">
                {item.percentage}% ({item.runs})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart showing daily language volume */}
      <div className="mt-5 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              {topLanguages.map((lang) => {
                const color = LANGUAGE_COLORS[lang] ?? '#888';
                return (
                  <linearGradient key={lang} id={`gradient-${lang}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: 'var(--color-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={35}
            />
            <Tooltip content={FocusTooltip} />
            {topLanguages.map((lang) => {
              const color = LANGUAGE_COLORS[lang] ?? '#888';
              return (
                <Area
                  key={lang}
                  type="monotone"
                  dataKey={lang}
                  stackId="languages"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#gradient-${lang})`}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
