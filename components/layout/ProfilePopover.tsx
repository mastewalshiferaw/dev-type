'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, Flame, History, ImageIcon, LogIn, LogOut, Send, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import AuthModal from '@/components/auth/AuthModal';
import Avatar from '@/components/leaderboard/Avatar';
import { signOut, useAuth, updateUserProfile, checkUsernameAvailable } from '@/lib/auth';
import { clearHistory, useBests, useHistory } from '@/lib/history';
import { languageLabel } from '@/lib/languages';
import { usePracticeLogs } from '@/lib/logs';
import { AVATAR_PRESETS, USERNAME_HINT, USERNAME_PATTERN, useProfile } from '@/lib/profile';
import { modeKeyLabel } from '@/lib/settings';
import { calculateStreak } from '@/lib/streak';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProfileForm() {
  const { username, avatarUrl, telegram } = useProfile();
  const { user } = useAuth();
  const [draftUsername, setDraftUsername] = useState(username);
  const [draftAvatar, setDraftAvatar] = useState(avatarUrl || '');
  const [draftTelegram, setDraftTelegram] = useState(telegram || '');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'saving' | 'saved' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync draft when user or stored profile changes
  useEffect(() => {
    setDraftUsername(user?.username || username || '');
    setDraftAvatar(user?.avatarUrl || avatarUrl || '');
    setDraftTelegram(user?.telegram || telegram || '');
  }, [user?.username, user?.avatarUrl, user?.telegram, username, avatarUrl, telegram]);

  // Live availability check as user types username (debounced 250ms)
  useEffect(() => {
    const clean = draftUsername.trim().replace(/\s+/g, '_');
    const currentName = (user?.username || username || '').trim().toLowerCase();

    // If empty or identical to own current name, clear errors
    if (!clean || clean.toLowerCase() === currentName) {
      setErrorMessage(null);
      setStatus('idle');
      return;
    }

    if (!USERNAME_PATTERN.test(clean)) {
      setErrorMessage(USERNAME_HINT);
      setStatus('invalid');
      return;
    }

    let cancelled = false;
    setStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(clean, user?.id);
        if (cancelled) return;
        if (!available) {
          setErrorMessage('This username is already taken. Please choose another one.');
          setStatus('invalid');
        } else {
          setErrorMessage(null);
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('idle');
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draftUsername, user?.username, user?.id, username]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = draftUsername.trim().replace(/\s+/g, '_');
    const cleanTelegram = draftTelegram.trim().replace(/^@/, '');
    const cleanAvatar = draftAvatar.trim();

    setDraftUsername(cleanName);
    setDraftTelegram(cleanTelegram);
    setDraftAvatar(cleanAvatar);

    if (!USERNAME_PATTERN.test(cleanName)) {
      setErrorMessage(USERNAME_HINT);
      setStatus('invalid');
      return;
    }

    const currentName = (user?.username || username || '').trim().toLowerCase();
    const currentAvatar = (user?.avatarUrl || avatarUrl || '').trim();
    const currentTg = (user?.telegram || telegram || '').trim().toLowerCase();

    if (
      cleanName.toLowerCase() === currentName &&
      cleanAvatar === currentAvatar &&
      cleanTelegram.toLowerCase() === currentTg
    ) {
      setStatus('saved');
      return;
    }

    setStatus('saving');
    setErrorMessage(null);

    // If username changed, do strict uniqueness check
    if (cleanName.toLowerCase() !== currentName) {
      const available = await checkUsernameAvailable(cleanName, user?.id);
      if (!available) {
        setErrorMessage('This username is already taken. Please choose another one.');
        setStatus('invalid');
        return;
      }
    }

    try {
      const res = await updateUserProfile({
        username: cleanName,
        avatarUrl: cleanAvatar,
        telegram: cleanTelegram,
      });

      if (res.error) {
        setErrorMessage(res.error);
        setStatus('invalid');
        return;
      }
      setStatus('saved');
    } catch {
      setErrorMessage('Failed to update profile');
      setStatus('invalid');
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-3 rounded-lg border border-line/60 bg-canvas/40 p-3">
      {/* Avatar Presets & Custom Photo */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="label text-muted">Profile Avatar</label>
          {draftAvatar ? (
            <button
              type="button"
              onClick={() => setDraftAvatar('')}
              className="text-2xs text-muted hover:text-danger transition-colors"
            >
              Reset to initials
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = draftAvatar === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDraftAvatar(isSelected ? '' : preset.url)}
                title={preset.label}
                className={`relative size-8 shrink-0 overflow-hidden rounded-full ring-2 transition-all ${
                  isSelected
                    ? 'ring-accent ring-offset-2 ring-offset-surface scale-105'
                    : 'ring-line/60 hover:ring-muted'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.url} alt={preset.label} className="size-full object-cover" />
              </button>
            );
          })}
        </div>

        {!showCustomAvatarInput ? (
          <button
            type="button"
            onClick={() => setShowCustomAvatarInput(true)}
            className="flex items-center gap-1 self-start text-2xs text-muted hover:text-ink transition-colors"
          >
            <ImageIcon size={11} aria-hidden />
            Custom photo URL
          </button>
        ) : (
          <input
            type="url"
            value={draftAvatar}
            onChange={(e) => setDraftAvatar(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="h-8 rounded-md border border-line-strong bg-canvas px-2.5 text-xs text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        )}
      </div>

      {/* Username Field */}
      <div className="flex flex-col gap-1">
        <label htmlFor="profile-username" className="label text-muted">
          Username
        </label>
        <input
          id="profile-username"
          value={draftUsername}
          onChange={(event) => {
            setDraftUsername(event.target.value);
            setStatus('idle');
            setErrorMessage(null);
          }}
          maxLength={18}
          autoComplete="nickname"
          placeholder="e.g. username"
          aria-invalid={status === 'invalid'}
          aria-describedby="profile-username-hint"
          className="h-8 rounded-md border border-line-strong bg-canvas px-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <p
          id="profile-username-hint"
          role={status === 'invalid' ? 'alert' : undefined}
          className={`text-2xs ${status === 'invalid' ? 'text-danger' : 'text-muted'}`}
        >
          {errorMessage || USERNAME_HINT}
        </p>
      </div>

      {/* Telegram Channel Field */}
      <div className="flex flex-col gap-1">
        <label htmlFor="profile-telegram" className="label text-muted">
          Telegram Channel (Dev Community)
        </label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-2.5 text-xs text-muted font-mono">@</span>
          <input
            id="profile-telegram"
            value={draftTelegram}
            onChange={(event) => {
              setDraftTelegram(event.target.value.replace(/^@/, ''));
              setStatus('idle');
            }}
            maxLength={32}
            placeholder="devchannel"
            className="h-8 w-full rounded-md border border-line-strong bg-canvas pl-6 pr-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <p className="text-2xs text-muted">Shows on leaderboard hover cards with a direct link.</p>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={status === 'saving' || status === 'checking' || status === 'invalid'}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent-fill px-3 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover disabled:opacity-50"
      >
        {status === 'saved' ? <Check size={14} aria-hidden /> : null}
        {status === 'saving'
          ? 'Saving...'
          : status === 'checking'
            ? 'Checking username...'
            : status === 'saved'
              ? 'Saved!'
              : 'Save Profile'}
      </button>
    </form>
  );
}

export default function ProfilePopover({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { username, avatarUrl, telegram } = useProfile();
  const effectiveAvatar = user?.avatarUrl || avatarUrl;
  const effectiveTelegram = user?.telegram || telegram;
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
          {username ? (
            <Avatar name={username} src={effectiveAvatar} size="sm" />
          ) : (
            <UserRound size={18} aria-hidden />
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            collisionPadding={16}
            className="z-50 flex w-[min(24rem,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto flex-col gap-4 rounded-xl border border-line bg-surface p-4 shadow-modal data-[state=open]:animate-pop"
          >
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {username ? (
                  <Avatar name={username} src={effectiveAvatar} />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-raised text-ink-dim">
                    <UserRound size={16} aria-hidden />
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-ink">{username || 'Anonymous coder'}</p>
                    {effectiveTelegram && (
                      <a
                        href={`https://t.me/${effectiveTelegram.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xs text-sky-400 font-semibold hover:underline"
                      >
                        @{effectiveTelegram.replace(/^@/, '')}
                      </a>
                    )}
                  </div>
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

            <ProfileForm key={`${username}-${effectiveAvatar}-${effectiveTelegram}`} />

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
