'use client';

import { Crown, RefreshCw, Star, Terminal, Trophy, UserRound } from 'lucide-react';
import { useState } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TIMEFRAMES, type RankedEntry, type Timeframe } from '@/lib/leaderboard';
import { LANGUAGE_FILTER_OPTIONS, type LanguageFilter } from '@/lib/languages';
import { useProfile } from '@/lib/profile';

const LIMIT = 10;

const TITLES: Record<Timeframe, { title: string; subtitle: string }> = {
  today: { title: 'Fastest Coders Today', subtitle: 'Live sprint (24h)' },
  week: { title: 'Weekly Leaders', subtitle: 'Last 7 days' },
  all: { title: 'Hall of Fame', subtitle: 'All time' },
};

function RankMark({ rank }: { rank: number }) {
  return (
    <span className="flex w-5 shrink-0 items-center justify-center">
      <span className="sr-only">Rank {rank}</span>
      {rank === 1 && <Crown size={18} aria-hidden className="fill-accent/20 text-accent" />}
      {rank === 2 && <Trophy size={16} aria-hidden className="fill-ink-dim/20 text-ink-dim" />}
      {rank === 3 && <Star size={16} aria-hidden className="fill-accent/10 text-accent" />}
      {rank > 3 && (
        <span aria-hidden className="text-xs font-semibold text-muted tabular-nums">
          {rank}
        </span>
      )}
    </span>
  );
}

function Row({ entry, isYou }: { entry: RankedEntry; isYou: boolean }) {
  return (
    <li
      aria-current={isYou ? 'true' : undefined}
      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
        isYou ? 'bg-accent-fill/12 ring-1 ring-accent/40' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <RankMark rank={entry.rank} />
        <Avatar name={entry.username} />
        <span className="truncate text-sm font-medium text-ink" title={entry.username}>
          {entry.username}
          {isYou && <span className="ml-1.5 text-2xs font-semibold text-accent">(you)</span>}
        </span>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-sm font-bold text-ink">
          {entry.wpm}
          <span className="ml-1 text-2xs font-normal text-muted">WPM</span>
        </p>
        <p className="text-2xs text-muted">{entry.accuracy}% acc</p>
      </div>
    </li>
  );
}

export default function Leaderboard({ onEditProfile }: { onEditProfile: () => void }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [language, setLanguage] = useState<LanguageFilter>('all');
  const { username } = useProfile();
  const { page, error, loading, retry } = useLeaderboard({
    timeframe,
    language,
    limit: LIMIT,
    username: username || undefined,
  });
  const { title, subtitle } = TITLES[timeframe];
  const you = page?.you ?? null;
  const youOnBoard = !!you && page!.entries.some((entry) => entry.id === you.id);

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="flex w-full flex-col rounded-3xl border border-line bg-surface/90 p-5 shadow-panel"
    >
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-fill/10 text-accent">
          <Trophy size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="leaderboard-title" className="text-sm font-bold text-ink">
            {title}
          </h2>
          <p className="flex items-center gap-1.5 text-2xs text-muted">
            <span aria-hidden className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            {subtitle}
          </p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SegmentedControl
          label="Timeframe"
          size="sm"
          options={TIMEFRAMES}
          value={timeframe}
          onChange={setTimeframe}
        />
        <Select
          label="Leaderboard language"
          value={language}
          options={LANGUAGE_FILTER_OPTIONS}
          onChange={setLanguage}
        />
      </div>

      <div aria-live="polite" aria-busy={loading} className="min-h-[22rem]">
        {loading ? (
          <ul aria-label="Loading leaderboard" className="flex flex-col gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
            <p className="text-xs text-danger">Couldn&apos;t load the leaderboard.</p>
            <p className="text-2xs text-muted">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-3 text-xs text-ink transition-ui hover:bg-raised"
            >
              <RefreshCw size={12} aria-hidden />
              Retry
            </button>
          </div>
        ) : page && page.entries.length > 0 ? (
          <ol className="flex flex-col gap-1">
            {page.entries.map((entry) => (
              <Row key={entry.id} entry={entry} isYou={entry.id === you?.id} />
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center">
            <Trophy size={20} aria-hidden className="mb-1 text-muted" />
            <p className="text-xs text-ink-dim">No scores here yet.</p>
            <p className="text-xs text-muted">Finish a timed run and claim #1.</p>
          </div>
        )}
      </div>

      {/* You row */}
      <div className="mt-4 border-t border-line pt-3">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-canvas/70 p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="w-8 pl-1 text-xs text-muted tabular-nums">{you ? `#${you.rank}` : '–'}</span>
            {username ? (
              <Avatar name={username} size="sm" />
            ) : (
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-raised text-ink-dim"
              >
                <Terminal size={14} />
              </span>
            )}
            {username ? (
              <span className="truncate text-xs font-semibold text-ink">{username}</span>
            ) : (
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-accent transition-ui hover:text-accent-strong"
              >
                <UserRound size={12} aria-hidden />
                Set username
              </button>
            )}
          </div>
          <span className="pr-1 text-xs font-bold text-accent tabular-nums">
            {you ? `${you.wpm} WPM` : 'Unranked'}
          </span>
        </div>
        {you && !youOnBoard && (
          <p className="mt-2 text-center text-2xs text-muted">
            You&apos;re #{you.rank}. Beat {page!.entries.at(-1)?.wpm} WPM to make the top {LIMIT}.
          </p>
        )}
      </div>
    </section>
  );
}
