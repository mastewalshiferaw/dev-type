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
  avatarUrl,
  telegram,
  isYou = false,
  className = '',
}: {
  rank: number;
  username: string;
  wpm: ReactNode;
  accuracy: ReactNode;
  language?: ScoreLanguage | 'all' | string;
  avatarUrl?: string;
  telegram?: string;
  isYou?: boolean;
  className?: string;
}) {
  const isShine = className.split(' ').includes('shine');
  const outerClassName = className
    .split(' ')
    .filter((c) => c !== 'shine')
    .join(' ');
  const displayLanguage = leaderboardLanguageLabel(language);
  const displayWpm = typeof wpm === 'number' && wpm > 280 ? '–' : wpm;
  const cleanTelegram = telegram ? telegram.trim().replace(/^@/, '') : '';

  return (
    <li
      aria-current={isYou ? 'true' : undefined}
      className={`relative flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:z-20 ${
        isYou ? 'bg-accent-fill/12 ring-1 ring-accent/40' : ''
      } ${outerClassName}`}
    >
      {isShine && (
        <div aria-hidden className="shine pointer-events-none absolute inset-0 overflow-hidden rounded-lg" />
      )}
      <div className="flex min-w-0 items-center gap-3">
        <RankMark rank={rank} />
        <Avatar name={username} src={avatarUrl} />
        <div className="group/name relative min-w-0 flex items-center gap-1.5">
          <span
            className="block truncate text-sm font-medium text-ink transition-colors group-hover/name:text-accent"
            title={`${username} · Language: ${displayLanguage}${cleanTelegram ? ` · Telegram: @${cleanTelegram}` : ''}`}
          >
            {username}
            {isYou && <span className="ml-1.5 text-2xs font-semibold text-accent">(you)</span>}
          </span>

          {cleanTelegram && (
            <a
              href={`https://t.me/${cleanTelegram}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`Telegram: @${cleanTelegram}`}
              className="inline-flex shrink-0 items-center text-sky-400 hover:text-sky-300 transition-colors"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.536-.196 1.006.128.832.945z" />
              </svg>
            </a>
          )}

          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden animate-pop items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 py-1 text-2xs font-medium whitespace-nowrap text-ink shadow-panel group-focus-within/name:flex group-hover/name:flex"
          >
            <span className="text-muted">Language:</span>
            <span className="font-semibold text-accent">{displayLanguage}</span>
            {cleanTelegram && (
              <>
                <span className="text-line-strong">·</span>
                <span className="text-muted">Telegram:</span>
                <span className="font-semibold text-sky-400">@{cleanTelegram}</span>
              </>
            )}
            <span className="absolute -bottom-1 left-4 size-2 -translate-x-1/2 rotate-45 border-r border-b border-line-strong bg-surface" />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className="text-sm font-bold text-ink">
          {displayWpm}
          <span className="ml-1 text-2xs font-normal text-muted">WPM</span>
        </p>
        <p className="text-2xs text-muted">{accuracy}% acc</p>
      </div>
    </li>
  );
}
