import type { ReactNode } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import RankMark from '@/components/leaderboard/RankMark';

/** One leaderboard line. `wpm` and `accuracy` are nodes so callers can animate them. */
export default function LeaderboardRow({
  rank,
  username,
  wpm,
  accuracy,
  isYou = false,
  className = '',
}: {
  rank: number;
  username: string;
  wpm: ReactNode;
  accuracy: ReactNode;
  isYou?: boolean;
  className?: string;
}) {
  return (
    <li
      aria-current={isYou ? 'true' : undefined}
      className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${className} ${
        isYou ? 'bg-accent-fill/12 ring-1 ring-accent/40' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <RankMark rank={rank} />
        <Avatar name={username} />
        <span className="truncate text-sm font-medium text-ink" title={username}>
          {username}
          {isYou && <span className="ml-1.5 text-2xs font-semibold text-accent">(you)</span>}
        </span>
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
