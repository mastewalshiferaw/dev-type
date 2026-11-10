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
  const { username, avatarUrl: localAvatarUrl, telegram: localTelegram } = useProfile();
  const { user } = useAuth();
  const effectiveUsername = (user && !user.isGuest ? user.username : null) || username;
  const effectiveAvatarUrl = user?.avatarUrl || localAvatarUrl;
  const effectiveTelegram = user?.telegram || localTelegram;
  const authUserId = user && !user.isGuest ? user.id : undefined;

  const { page, error, loading, retry } = useLeaderboard({
    timeframe,
    language,
    limit,
    username: effectiveUsername || undefined,
    userId: authUserId,
  });
  const { title, subtitle } = TITLES[timeframe];
  // Sanitize and filter entries at UI level (DEV-002: drop any spoofed scores > 280 WPM)
  const validEntries = (page?.entries ?? []).filter(
    (entry) =>
      typeof entry.wpm === 'number' &&
      entry.wpm > 0 &&
      entry.wpm <= 280 &&
      typeof entry.accuracy === 'number' &&
      entry.accuracy >= 0 &&
      entry.accuracy <= 100
  );
  const you =
    page?.you && typeof page.you.wpm === 'number' && page.you.wpm > 0 && page.you.wpm <= 280
      ? page.you
      : null;
  const youOnBoard = !!you && validEntries.some((entry) => entry.id === you.id);
  const totalCount = validEntries.length;

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
            {page ? ` · ${totalCount} ${totalCount === 1 ? 'coder' : 'coders'}` : ''}
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
        ) : validEntries.length > 0 ? (
          <>
            <ol className="flex flex-col gap-1">
              {validEntries.map((entry) => (
                <LeaderboardRow
                  key={entry.id}
                  rank={entry.rank}
                  username={entry.username}
                  language={entry.language}
                  wpm={entry.wpm}
                  accuracy={entry.accuracy}
                  avatarUrl={entry.avatarUrl}
                  telegram={entry.telegram}
                  isYou={entry.id === you?.id}
                />
              ))}
            </ol>

            {/* Pagination / View More Controls */}
            {totalCount > validEntries.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                <p className="text-2xs text-muted">
                  Showing <strong className="text-ink">{validEntries.length}</strong> of{' '}
                  <strong className="text-ink">{totalCount}</strong> ranked coders
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLimit((prev) => Math.min(prev + 15, 100))}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-line bg-canvas px-2.5 text-2xs font-semibold text-ink transition-ui hover:bg-raised"
                  >
                    Show next {Math.min(15, totalCount - validEntries.length)}
                    <ChevronDown size={12} aria-hidden />
                  </button>
                  {totalCount > validEntries.length && totalCount <= 100 && (
                    <button
                      type="button"
                      onClick={() => setLimit(100)}
                      className="inline-flex h-7 items-center rounded-md border border-line bg-canvas px-2.5 text-2xs font-semibold text-accent transition-ui hover:bg-raised"
                    >
                      View all ({totalCount})
                    </button>
                  )}
                </div>
              </div>
            ) : limit > 10 ? (
              <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
                <p className="text-2xs text-muted">
                  Showing all <strong className="text-ink">{validEntries.length}</strong> coders
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
              <Avatar
                name={username}
                channel={effectiveTelegram || you?.telegram}
                size="sm"
                src={effectiveAvatarUrl || you?.avatarUrl}
              />
            ) : (
              <span
                aria-hidden
                className="flex size-7 items-center justify-center rounded-full bg-raised text-ink-dim"
              >
                <Terminal size={14} />
              </span>
            )}
            {username ? (
              <div className="group/name relative min-w-0 flex items-center gap-1.5">
                <span
                  className="block truncate text-xs font-semibold text-ink transition-colors group-hover/name:text-accent"
                  title={
                    you?.language
                      ? `${username} · Language: ${leaderboardLanguageLabel(you.language)}${effectiveTelegram ? ` · Telegram: @${effectiveTelegram.replace(/^@/, '')}` : ''}`
                      : username
                  }
                >
                  {username}
                </span>
                {effectiveTelegram && (
                  <a
                    href={`https://t.me/${effectiveTelegram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Telegram: @${effectiveTelegram.replace(/^@/, '')}`}
                    className="inline-flex shrink-0 items-center text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <svg className="size-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.536-.196 1.006.128.832.945z" />
                    </svg>
                  </a>
                )}
                {you?.language && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden animate-pop items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1 text-2xs font-medium whitespace-nowrap text-ink shadow-panel group-focus-within/name:flex group-hover/name:flex"
                  >
                    <span className="text-muted">Language:</span>
                    <span className="font-semibold text-accent">
                      {leaderboardLanguageLabel(you.language)}
                    </span>
                    {effectiveTelegram && (
                      <>
                        <span className="text-line-strong">·</span>
                        <span className="text-muted">Telegram:</span>
                        <span className="font-semibold text-sky-400">@{effectiveTelegram.replace(/^@/, '')}</span>
                      </>
                    )}
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
