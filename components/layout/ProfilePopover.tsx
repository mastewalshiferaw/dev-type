'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, History, Trash2, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import { clearHistory, useBests, useHistory } from '@/lib/history';
import { languageLabel } from '@/lib/languages';
import { setUsername, USERNAME_HINT, USERNAME_PATTERN, useProfile } from '@/lib/profile';
import { modeKeyLabel } from '@/lib/settings';

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
  const { username } = useProfile();
  const history = useHistory();
  const bests = useBests();

  const best = history.reduce((max, run) => Math.max(max, run.wpm), 0);
  const average = history.length
    ? Math.round(history.reduce((sum, run) => sum + run.wpm, 0) / history.length)
    : 0;
  const topBests = Object.values(bests)
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, 4);

  return (
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
              <p className="text-2xs text-muted">Stored on this device</p>
            </div>
          </div>

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

          {history.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear your run history and personal bests on this device?'))
                  clearHistory();
              }}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md text-xs text-muted transition-ui hover:bg-raised hover:text-danger"
            >
              <Trash2 size={12} aria-hidden />
              Clear history
            </button>
          )}
          <Popover.Arrow className="fill-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
