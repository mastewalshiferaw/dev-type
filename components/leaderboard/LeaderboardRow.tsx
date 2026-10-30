import type { ReactNode } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import RankMark from '@/components/leaderboard/RankMark';
import { leaderboardLanguageLabel } from '@/lib/languages';
import type { ScoreLanguage } from '@/lib/leaderboard/types';

/** One leaderboard line. `wpm` and `accuracy` are nodes so callers can animate them. */
export default function LeaderboardRow({
  rank,
  username,
  wpm,
  accuracy,
  language,
  isYou = false,
  className = '',
}: {
  rank: number;
  username: string;
  wpm: ReactNode;
  accuracy: ReactNode;
  language?: ScoreLanguage | 'all' | string;
  isYou?: boolean;
  className?: string;
}) {
  const isShine = className.split(' ').includes('shine');
  const outerClassName = className
    .split(' ')
    .filter((c) => c !== 'shine')
    .join(' ');
  const displayLanguage = leaderboardLanguageLabel(language);

  return (
    <li
      aria-current={isYou ? 'true' : undefined}
      className={`relative flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:z-20 ${
        isYou ? 'bg-accent-fill/12 ring-1 ring-accent/40' : ''
      } ${outerClassName}`}
    >
      {isShine && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg shine" />
      )}
      <div className="flex min-w-0 items-center gap-3">
        <RankMark rank={rank} />
        <Avatar name={username} />
        <div className="relative group/name min-w-0">
          <span
            tabIndex={0}
            className="truncate block text-sm font-medium text-ink transition-colors cursor-pointer group-hover/name:text-accent group-focus-visible/name:text-accent focus:outline-none"
            title={`${username} · Language: ${displayLanguage}`}
          >
            {username}
            {isYou && <span className="ml-1.5 text-2xs font-semibold text-accent">(you)</span>}
          </span>
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-0 mb-1.5 hidden group-hover/name:flex group-focus-within/name:flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong bg-surface px-2.5 py-1 text-2xs font-medium text-ink shadow-panel z-30 animate-pop"
          >
            <span className="text-muted">Language:</span>
            <span className="font-semibold text-accent">{displayLanguage}</span>
            <span className="absolute -bottom-1 left-4 size-2 -translate-x-1/2 rotate-45 border-b border-r border-line-strong bg-surface" />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-sm font-bold text-ink">
          {wpm}
          <span className="ml-1 text-2xs font-normal text-muted">WPM</span>
        </p>
        <p className="text-2xs text-muted">{accuracy}% acc</p>
      </div>
    </li>
  );
}
