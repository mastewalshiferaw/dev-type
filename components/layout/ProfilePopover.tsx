'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, Flame, History, LogIn, LogOut, Sparkles, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import AuthModal from '@/components/auth/AuthModal';
import Avatar from '@/components/leaderboard/Avatar';
import { signOut, useAuth } from '@/lib/auth';
import { clearHistory, useBests, useHistory } from '@/lib/history';
import { languageLabel } from '@/lib/languages';
import { usePracticeLogs } from '@/lib/logs';
import { setUsername, USERNAME_HINT, USERNAME_PATTERN, useProfile } from '@/lib/profile';
import { modeKeyLabel } from '@/lib/settings';
import { calculateStreak } from '@/lib/streak';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UsernameForm() {
  const { username } = useProfile();
  const [draft, setDraft] = useState(username);
  const [status, setStatus] = useState<'idle' | 'saved' | 'invalid'>('idle');

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!USERNAME_PATTERN.test(draft.trim())) {
      setStatus('invalid');
      return;
    }
    setUsername(draft);
    setStatus('saved');
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-1.5">
      <label htmlFor="profile-username" className="label text-muted">
        Username
      </label>
      <div className="flex gap-2">
        <input
          id="profile-username"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setStatus('idle');
          }}
          maxLength={18}
          autoComplete="nickname"
          placeholder="e.g. vim_queen"
          aria-invalid={status === 'invalid'}
          aria-describedby="profile-username-hint"
          className="h-9 min-w-0 flex-1 rounded-md border border-line-strong bg-canvas px-3 text-sm text-ink transition-ui placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1 rounded-md bg-accent-fill px-3 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
        >
          {status === 'saved' ? <Check size={14} aria-hidden /> : null}
          {status === 'saved' ? 'Saved' : 'Save'}
        </button>
      </div>
      <p
        id="profile-username-hint"
        role={status === 'invalid' ? 'alert' : undefined}
        className={`text-2xs ${status === 'invalid' ? 'text-danger' : 'text-muted'}`}
      >
        {USERNAME_HINT}
      </p>
    </form>
  );
}

export default function ProfilePopover({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { username } = useProfile();
  const history = useHistory();
  const bests = useBests();
  const logs = usePracticeLogs();
  const streak = calculateStreak(logs);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const best = history.reduce((max, run) => Math.max(max, run.wpm), 0);
  const average = history.length
    ? Math.round(history.reduce((sum, run) => sum + run.wpm, 0) / history.length)
    : 0;
  const topBests = Object.values(bests)
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, 4);

  return (
    <>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger
          aria-label={username ? `Profile: ${username}` : 'Profile'}
          className="flex size-9 items-center justify-center rounded-full text-muted transition-ui hover:bg-raised hover:text-ink"
        >
          {username ? <Avatar name={username} size="sm" /> : <UserRound size={18} aria-hidden />}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-modal data-[state=open]:animate-pop"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {username ? (
                  <Avatar name={username} />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-raised text-ink-dim">
                    <UserRound size={16} aria-hidden />
                  </span>
                )}
                <div>
                  <p className="text-sm font-bold text-ink">{username || 'Anonymous coder'}</p>
                  <p className="text-2xs text-muted">
                    {user && !user.isGuest ? user.email : 'Local Guest · Stored on device'}
                  </p>
                </div>
              </div>

              {streak.currentStreak > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-bold ${
                    streak.isPracticedToday ? 'bg-amber-500/15 text-amber-500' : 'bg-raised text-muted'
                  }`}
                >
                  <Flame size={12} className={streak.isPracticedToday ? 'fill-amber-500' : ''} />
                  {streak.currentStreak}d
                </span>
              )}
            </div>

            {/* Auth Action if guest */}
            {(!user || user.isGuest) && (
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-accent-strong">
                    <Sparkles size={14} className="text-accent" />
                    Sync across devices
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setAuthModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md bg-accent-fill px-2 py-1 text-2xs font-bold text-accent-ink hover:bg-accent-fill-hover"
                  >
                    <LogIn size={11} />
                    Sign In
                  </button>
                </div>
              </div>
            )}

            <UsernameForm key={username} />

            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Runs', history.length],
                ['Best', best || '–'],
                ['Average', average || '–'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-canvas/60 py-2">
                  <dt className="label text-muted">{label}</dt>
                  <dd className="text-base font-bold text-ink tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Link to Full Account Activity & Stats */}
            <Link
              href="/account"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas px-3 text-xs font-semibold text-ink transition-ui hover:bg-raised"
            >
              🔥 View Heatmap & Language Stats →
            </Link>

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 label text-muted">
                <History size={12} aria-hidden />
                Personal bests
              </h3>
              {topBests.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-xs text-muted">
                  No runs yet. Finish one to set your first best.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {topBests.map((run) => (
                    <li key={run.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-ink-dim">
                        {languageLabel(run.language)} · {modeKeyLabel(run.modeKey)}
                      </span>
                      <span className="font-semibold text-ink tabular-nums">
                        {run.wpm} <span className="font-normal text-muted">WPM</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line pt-2">
              {history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear your run history and personal bests on this device?'))
                      clearHistory();
                  }}
                  className="inline-flex h-7 items-center gap-1 rounded-md text-2xs text-muted transition-ui hover:text-danger"
                >
                  <Trash2 size={12} aria-hidden />
                  Clear history
                </button>
              ) : (
                <span />
              )}

              {user && !user.isGuest && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex h-7 items-center gap-1 rounded-md text-2xs font-medium text-muted transition-ui hover:text-ink"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              )}
            </div>
            <Popover.Arrow className="fill-line" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
