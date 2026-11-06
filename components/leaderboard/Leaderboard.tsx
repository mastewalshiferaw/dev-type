'use client';

import { ChevronDown, RefreshCw, Terminal, Trophy, UserRound } from 'lucide-react';
import { useState } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TIMEFRAMES, type Timeframe } from '@/lib/leaderboard';
import { LANGUAGE_FILTER_OPTIONS, leaderboardLanguageLabel, type LanguageFilter } from '@/lib/languages';
import { useProfile } from '@/lib/profile';
import { useAuth } from '@/lib/auth';

const LIMIT_OPTIONS = [
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
  { value: '50', label: 'Top 50' },
  { value: '100', label: 'Top 100' },
];

const TITLES: Record<Timeframe, { title: string; subtitle: string }> = {
  today: { title: 'Fastest Coders Today', subtitle: 'Live sprint (24h)' },
  week: { title: 'Weekly Leaders', subtitle: 'Last 7 days' },
  all: { title: 'Hall of Fame', subtitle: 'All time' },
};

export default function Leaderboard({ onEditProfile }: { onEditProfile: () => void }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const [language, setLanguage] = useState<LanguageFilter>('all');
  const [limit, setLimit] = useState<number>(10);
  const { username } = useProfile();
  const { user } = useAuth();
  const { page, error, loading, retry } = useLeaderboard({
    timeframe,
    language,
    limit,
    username: username || undefined,
    userId: user?.id,
  });
  const { title, subtitle } = TITLES[timeframe];
  const you = page?.you ?? null;
  const youOnBoard = !!you && page!.entries.some((entry) => entry.id === you.id);

  return (
    <section
      aria-labelledby="leaderboard-title"
      className="flex w-full flex-col rounded-xl border border-line bg-surface/90 p-5 shadow-panel"
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
            {page ? ` · ${page.totalCount} ${page.totalCount === 1 ? 'coder' : 'coders'}` : ''}
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
        <Select
          label="Limit"
          value={String(limit)}
          options={LIMIT_OPTIONS}
          onChange={(val) => setLimit(Number(val))}
        />
      </div>

      <div aria-busy={loading} className="min-h-[22rem]">
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
          <>
            <ol className="flex flex-col gap-1">
              {page.entries.map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  rank={entry.rank}
                  username={entry.username}
                  language={entry.language}
                  wpm={entry.wpm}
                  accuracy={entry.accuracy}
                  isYou={entry.id === you?.id}
                />
              ))}
            </ol>

            {/* Pagination / View More Controls */}
            {page.totalCount > page.entries.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                <p className="text-2xs text-muted">
                  Showing <strong className="text-ink">{page.entries.length}</strong> of{' '}
                  <strong className="text-ink">{page.totalCount}</strong> ranked coders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLimit((prev) => Math.min(prev + 15, 100))}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-canvas px-2.5 text-2xs font-semibold text-ink transition-ui hover:bg-raised"
                  >
                    Show next {Math.min(15, page.totalCount - page.entries.length)}
                    <ChevronDown size={12} aria-hidden />
                  </button>
                  {page.totalCount > page.entries.length && page.totalCount <= 100 && (
                    <button
                      type="button"
                      onClick={() => setLimit(100)}
                      className="inline-flex h-7 items-center rounded-md border border-line bg-canvas px-2.5 text-2xs font-semibold text-accent transition-ui hover:bg-raised"
                    >
                      View all ({page.totalCount})
                    </button>
                  )}
                </div>
              </div>
            ) : limit > 10 ? (
              <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
                <p className="text-2xs text-muted">
                  Showing all <strong className="text-ink">{page.entries.length}</strong> coders
                </p>
                <button
                  type="button"
                  onClick={() => setLimit(10)}
                  className="text-2xs text-muted underline transition-ui hover:text-ink"
                >
                  Collapse to Top 10
                </button>
              </div>
            ) : null}
          </>
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
        <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-canvas/70 p-2.5">
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
              <div className="group/name relative min-w-0">
                <span
                  className="block truncate text-xs font-semibold text-ink transition-colors group-hover/name:text-accent"
                  title={
                    you?.language
                      ? `${username} · Language: ${leaderboardLanguageLabel(you.language)}`
                      : username
                  }
                >
                  {username}
                </span>
                {you?.language && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden animate-pop items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1 text-2xs font-medium whitespace-nowrap text-ink shadow-panel group-focus-within/name:flex group-hover/name:flex"
                  >
                    <span className="text-muted">Language:</span>
                    <span className="font-semibold text-accent">
                      {leaderboardLanguageLabel(you.language)}
                    </span>
                    <span className="absolute -bottom-1 left-4 size-2 -translate-x-1/2 rotate-45 border-r border-b border-line-strong bg-surface" />
                  </div>
                )}
              </div>
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
            You&apos;re #{you.rank}. Beat {page!.entries.at(-1)?.wpm} WPM to make the visible top {limit}.
          </p>
        )}
      </div>
    </section>
  );
}
