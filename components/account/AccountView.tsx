'use client';

import { ArrowLeft, Flame, History, LogIn, LogOut, Trophy, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMounted } from '@/hooks/useMounted';
import Skeleton from '@/components/ui/Skeleton';
import AuthModal from '@/components/auth/AuthModal';
import ContributionGraph from '@/components/account/ContributionGraph';
import LanguageFocusChart from '@/components/account/LanguageFocusChart';
import Avatar from '@/components/leaderboard/Avatar';
import { useAuth, signOut } from '@/lib/auth';
import { leaderboardLanguageLabel } from '@/lib/languages';
import { usePracticeLogs } from '@/lib/logs';
import { modeKeyLabel } from '@/lib/settings';
import { calculateStreak } from '@/lib/streak';

export default function AccountView() {
  const mounted = useMounted();
  const { user } = useAuth();
  const logs = usePracticeLogs();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  if (!mounted) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
        <div className="rounded h-8 w-32 bg-surface/50" />
        <Skeleton className="rounded-2xl h-40" />
        <Skeleton className="rounded-2xl h-36" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  const streak = calculateStreak(logs);

  const { currentStreak, bestStreak, isPracticedToday, weeklyDays, totalActiveDays } = streak;

  const totalRuns = logs.length;
  const bestWpm = logs.reduce((max, l) => Math.max(max, l.wpm), 0);
  const avgWpm = totalRuns ? Math.round(logs.reduce((sum, l) => sum + l.wpm, 0) / totalRuns) : 0;
  const totalDurationSeconds = Math.round(logs.reduce((sum, l) => sum + l.durationMs, 0) / 1000);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);

  const formatRunDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/play"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-ui hover:text-ink"
        >
          <ArrowLeft size={16} />
          Back to Typing Test
        </Link>
        {!user || user.isGuest ? (
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setAuthModalOpen(true);
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent-fill px-3 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
          >
            <LogIn size={14} />
            Sign In / Sync
          </button>
        ) : (
          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-surface px-3 text-xs font-medium text-muted transition-ui hover:bg-raised hover:text-ink"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        )}
      </div>

      {/* User Profile Header Card */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-panel sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={user?.username || 'Guest'} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink">{user?.username || 'Guest Coder'}</h1>
                {user && !user.isGuest ? (
                  <span className="text-3xs inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-bold text-success">
                    <UserCheck size={11} />
                    Verified
                  </span>
                ) : (
                  <span className="text-3xs rounded-full bg-raised px-2 py-0.5 font-medium text-muted">
                    Local Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                {user?.isGuest ? 'Local practice sessions on this browser' : user?.email || 'Logged in coder'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
            <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
              <span className="text-3xs label text-muted">Total Runs</span>
              <p className="text-base font-bold text-ink tabular-nums">{totalRuns}</p>
            </div>
            <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
              <span className="text-3xs label text-muted">Top Speed</span>
              <p className="text-base font-bold text-ink tabular-nums">
                {bestWpm} <span className="text-3xs font-normal text-muted">WPM</span>
              </p>
            </div>
            <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
              <span className="text-3xs label text-muted">Avg Speed</span>
              <p className="text-base font-bold text-ink tabular-nums">
                {avgWpm} <span className="text-3xs font-normal text-muted">WPM</span>
              </p>
            </div>
            <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
              <span className="text-3xs label text-muted">Active Days</span>
              <p className="text-base font-bold text-ink tabular-nums">{totalActiveDays}</p>
            </div>
            <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2">
              <span className="text-3xs label text-muted">Typing Time</span>
              <p className="text-base font-bold text-ink tabular-nums">
                {totalMinutes >= 60
                  ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                  : `${totalMinutes}m`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duolingo Streak "Fire" Section */}
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-panel sm:p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div
              className={`rounded-2xl flex size-16 shrink-0 items-center justify-center ${
                isPracticedToday
                  ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.4)]'
                  : currentStreak > 0
                    ? 'bg-amber-500/10 text-amber-500/70'
                    : 'bg-raised text-muted'
              }`}
            >
              <Flame
                size={38}
                className={isPracticedToday ? 'animate-pulse fill-amber-500' : 'stroke-[1.75]'}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-ink tabular-nums">
                  {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'} Streak
                </h2>
                {isPracticedToday && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-2xs font-bold text-amber-600 dark:text-amber-400">
                    🔥 Fire Lit Today!
                  </span>
                )}
              </div>
              <p className="mt-1 max-w-md text-xs text-muted">
                {isPracticedToday
                  ? 'Fantastic consistency! You typed code today and your fire is glowing strong.'
                  : currentStreak > 0
                    ? 'Your streak is still active from yesterday. Complete at least one typing session today to light your flame!'
                    : 'Start your coding streak today! Complete any typing test to set your fire.'}
              </p>
            </div>
          </div>

          {/* Duolingo Weekday Tracker */}
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-canvas p-3 sm:min-w-64">
            <div className="flex items-center justify-between text-2xs font-semibold text-muted">
              <span>Weekly Goals</span>
              <span className="flex items-center gap-1 font-bold text-ink">
                <Trophy size={12} className="text-amber-500" />
                Best: {bestStreak} days
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
              {weeklyDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-3xs font-medium text-muted">{d.dayLabel}</span>
                  <div
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-ui ${
                      d.isCompleted
                        ? 'bg-amber-500 text-white shadow-xs'
                        : d.isToday
                          ? 'border-2 border-dashed border-amber-500 text-amber-500'
                          : 'bg-raised text-muted/30'
                    }`}
                  >
                    {d.isCompleted ? '✓' : d.isToday ? '•' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Contribution Heatmap */}
      <ContributionGraph logs={logs} />

      {/* Language Focus Over Time Graph */}
      <LanguageFocusChart logs={logs} />

      {/* Recent Practice Logs Table */}
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-ink">Recent Practice Sessions</h3>
          </div>
          <span className="text-2xs text-muted tabular-nums">
            Showing last {Math.min(logs.length, 25)} runs
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted">
            No runs recorded yet. Start practicing on /play!
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-3xs border-b border-line font-bold tracking-wider text-muted uppercase">
                  <th className="py-2 pr-3">Date</th>
                  <th className="px-3 py-2">Language</th>
                  <th className="px-3 py-2">Mode</th>
                  <th className="px-3 py-2 text-right">WPM</th>
                  <th className="px-3 py-2 text-right">Accuracy</th>
                  <th className="py-2 pl-3 text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {logs.slice(0, 25).map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-canvas/50">
                    <td className="py-2.5 pr-3 whitespace-nowrap text-ink-dim">
                      {formatRunDate(log.createdAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center rounded-md border border-line bg-canvas px-2 py-0.5 text-2xs font-medium text-ink">
                        {leaderboardLanguageLabel(log.language)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{modeKeyLabel(log.modeKey)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-ink tabular-nums">
                      {log.wpm} <span className="text-3xs font-normal text-muted">wpm</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-dim tabular-nums">{log.accuracy}%</td>
                    <td className="py-2.5 pl-3 text-right text-muted tabular-nums">
                      {Math.round(log.durationMs / 1000)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultMode={authMode} />
    </div>
  );
}
