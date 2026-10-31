'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, Flame, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMounted } from '@/hooks/useMounted';
import { usePracticeLogs } from '@/lib/logs';
import { calculateStreak } from '@/lib/streak';

interface Props {
  className?: string;
}

export default function StreakBadge({ className = '' }: Props) {
  const mounted = useMounted();
  const logs = usePracticeLogs();
  const [open, setOpen] = useState(false);

  if (!mounted) {
    return (
      <div
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold text-muted/70 ${className}`}
        aria-hidden
      >
        <span className="flex items-center justify-center text-muted">
          <Flame size={18} className="stroke-[1.75]" />
        </span>
        <span className="tabular-nums">0</span>
      </div>
    );
  }

  const streak = calculateStreak(logs);
  const { currentStreak, isPracticedToday, bestStreak, weeklyDays } = streak;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={`Streak: ${currentStreak} days (${isPracticedToday ? 'Active today' : 'Not practiced today'})`}
        className={`group relative inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold transition-ui ${
          isPracticedToday
            ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 dark:text-amber-400'
            : currentStreak > 0
              ? 'bg-raised text-muted hover:text-ink'
              : 'text-muted/70 hover:bg-raised hover:text-ink'
        } ${className}`}
      >
        <span
          className={`flex items-center justify-center transition-transform group-hover:scale-110 ${
            isPracticedToday ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-muted'
          }`}
        >
          <Flame
            size={18}
            className={`${isPracticedToday ? 'animate-pulse fill-amber-500' : 'stroke-[1.75]'}`}
          />
        </span>
        <span className="tabular-nums">{currentStreak}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 rounded-xl border border-line bg-surface p-4 shadow-modal data-[state=open]:animate-pop"
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 items-center justify-center rounded-xl ${
                isPracticedToday
                  ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-raised text-muted'
              }`}
            >
              <Flame size={24} className={isPracticedToday ? 'animate-bounce fill-amber-500' : ''} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-ink">
                {currentStreak === 1 ? '1 Day Streak' : `${currentStreak} Days Streak`}
              </h4>
              <p className="text-2xs text-muted">
                {isPracticedToday
                  ? "You're on fire! You practiced today."
                  : currentStreak > 0
                    ? 'Practice today to keep your streak alive!'
                    : 'Complete a test today to start your streak.'}
              </p>
            </div>
          </div>

          {/* Week progress dots (Duolingo style) */}
          <div className="mt-4 rounded-lg border border-line bg-canvas p-2.5">
            <p className="text-3xs mb-2 font-semibold tracking-wider text-muted uppercase">This Week</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weeklyDays.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-3xs font-medium text-muted">{day.dayLabel}</span>
                  <div
                    className={`flex size-6 items-center justify-center rounded-full text-2xs transition-ui ${
                      day.isCompleted
                        ? 'bg-amber-500 font-bold text-white shadow-xs'
                        : day.isToday
                          ? 'border border-dashed border-amber-500/60 text-amber-500'
                          : 'bg-raised text-muted/40'
                    }`}
                  >
                    {day.isCompleted ? (
                      <Check size={11} strokeWidth={3} />
                    ) : day.isToday ? (
                      <span className="size-1.5 animate-ping rounded-full bg-amber-500" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Streak & Stats Link */}
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <Trophy size={13} className="text-amber-500" />
              Best: <strong className="text-ink tabular-nums">{bestStreak} days</strong>
            </span>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="font-semibold text-accent hover:underline"
            >
              Account stats →
            </Link>
          </div>

          <Popover.Arrow className="fill-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
