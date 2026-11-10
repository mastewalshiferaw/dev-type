'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, CheckCircle2, Copy, Flame, History, ImageIcon, Loader2, LogIn, LogOut, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import Avatar from '@/components/leaderboard/Avatar';
import { signOut, useAuth, updateUserProfile, checkUsernameAvailable, openAuthModal } from '@/lib/auth';
import { clearHistory, useBests, useHistory } from '@/lib/history';
import { languageLabel } from '@/lib/languages';
import { usePracticeLogs } from '@/lib/logs';
import {
  AVATAR_PRESETS,
  USERNAME_HINT,
  USERNAME_PATTERN,
  useProfile,
  cleanTelegramChannel,
  fetchTelegramAvatar,
} from '@/lib/profile';
import { getTelegramVerificationCode, verifyTelegramChannel } from '@/lib/telegram';
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
  const [channelAvatar, setChannelAvatar] = useState<string | null>(null);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [channelHasCustomPhoto, setChannelHasCustomPhoto] = useState(false);
  const [channelInitials, setChannelInitials] = useState<string | null>(null);
  const [channelFetchStatus, setChannelFetchStatus] = useState<'idle' | 'fetching' | 'found' | 'not-found'>('idle');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'saving' | 'saved' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const isVerifiedOwner = Boolean(
    user &&
    !user.isGuest &&
    user.telegramVerified &&
    draftTelegram &&
    cleanTelegramChannel(user.telegram) === cleanTelegramChannel(draftTelegram)
  );

  const verificationCode = user && !user.isGuest ? getTelegramVerificationCode(user.id) : '';

  const handleCopyCode = () => {
    if (!verificationCode) return;
    navigator.clipboard.writeText(verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleVerifyChannel = async () => {
    if (!user || user.isGuest) {
      openAuthModal('signin');
      return;
    }
    const clean = cleanTelegramChannel(draftTelegram);
    if (!clean) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyTelegramChannel(clean, user.id);
      if (res.success && res.verified) {
        if (res.avatarUrl) {
          setDraftAvatar(res.avatarUrl);
          setChannelAvatar(res.avatarUrl);
        }
        await updateUserProfile({
          telegram: clean,
          ...(res.avatarUrl ? { avatarUrl: res.avatarUrl } : {}),
        });
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        setVerifyError(res.error || 'Verification failed. Code was not found in channel.');
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

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

  // Debounced auto-fetch for Telegram channel photo
  useEffect(() => {
    const clean = cleanTelegramChannel(draftTelegram);
    if (!clean || clean.length < 4) {
      setChannelAvatar(null);
      setChannelTitle(null);
      setChannelHasCustomPhoto(false);
      setChannelInitials(null);
      setChannelFetchStatus('idle');
      return;
    }

    let cancelled = false;
    setChannelFetchStatus('fetching');

    const timer = setTimeout(async () => {
      try {
        const res = await fetchTelegramAvatar(clean);
        if (cancelled) return;
        if (res.avatarUrl) {
          setChannelAvatar(res.avatarUrl);
          setChannelTitle(res.title || null);
          setChannelHasCustomPhoto(Boolean(res.hasCustomPhoto));
          setChannelInitials(res.initials || null);
          setChannelFetchStatus('found');
          // Automatically set draftAvatar if the user hasn't selected another avatar or was using channel avatar
          setDraftAvatar((prev) => {
            if (!prev || prev === channelAvatar) {
              return res.avatarUrl!;
            }
            return prev;
          });
        } else {
          setChannelAvatar(null);
          setChannelTitle(null);
          setChannelHasCustomPhoto(false);
          setChannelInitials(null);
          setChannelFetchStatus('not-found');
        }
      } catch {
        if (!cancelled) setChannelFetchStatus('idle');
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draftTelegram]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = draftUsername.trim().replace(/\s+/g, '_');
    const cleanTelegram = cleanTelegramChannel(draftTelegram);
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
          {/* Telegram Channel Avatar option if available */}
          {channelAvatar && (
            <button
              type="button"
              onClick={() => setDraftAvatar(draftAvatar === channelAvatar ? '' : channelAvatar)}
              title={
                channelTitle
                  ? `Use Telegram Channel ${channelHasCustomPhoto ? 'photo' : 'letter avatar'} (${channelTitle})`
                  : `Use Telegram Channel ${channelHasCustomPhoto ? 'photo' : 'letter avatar'}`
              }
              className={`relative size-8 shrink-0 overflow-hidden rounded-full ring-2 transition-all ${
                draftAvatar === channelAvatar
                  ? 'ring-accent ring-offset-2 ring-offset-surface scale-105'
                  : 'ring-sky-500/50 hover:ring-sky-400'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={channelAvatar} alt="Telegram channel avatar" className="size-full object-cover" />
              <span
                title={channelHasCustomPhoto ? 'Channel Photo' : 'Channel Letter Avatar'}
                className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-sky-500 text-white"
              >
                <svg className="size-2 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.536-.196 1.006.128.832.945z" />
                </svg>
              </span>
            </button>
          )}

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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="profile-telegram" className="label text-muted">
            Telegram Channel (Dev Community)
          </label>
          {channelFetchStatus === 'fetching' && (
            <span className="flex items-center gap-1 text-3xs text-muted">
              <Loader2 size={10} className="animate-spin text-sky-400" />
              Fetching photo...
            </span>
          )}
        </div>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-2.5 text-xs text-muted font-mono">@</span>
          <input
            id="profile-telegram"
            value={draftTelegram}
            onChange={(event) => {
              setDraftTelegram(cleanTelegramChannel(event.target.value));
              setStatus('idle');
            }}
            maxLength={32}
            placeholder="channelname or t.me/channel"
            className="h-8 w-full rounded-md border border-line-strong bg-canvas pl-6 pr-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Live Channel Avatar preview & quick apply card */}
        {channelAvatar && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-sky-500/25 bg-sky-500/8 px-2.5 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channelAvatar}
                alt="Channel avatar"
                className="size-7 shrink-0 rounded-full object-cover ring-1 ring-sky-500/50"
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-2xs font-semibold text-ink truncate">
                  {channelTitle || `@${cleanTelegramChannel(draftTelegram)}`}
                </span>
                <span className="text-3xs text-sky-400">
                  {channelHasCustomPhoto
                    ? 'Channel photo detected'
                    : `Channel letter avatar (${channelInitials || 'initials'})`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDraftAvatar(channelAvatar)}
              className={`shrink-0 rounded px-2 py-1 text-3xs font-bold transition-all ${
                draftAvatar === channelAvatar
                  ? 'bg-accent/20 text-accent ring-1 ring-accent/30'
                  : 'bg-sky-500 text-white hover:bg-sky-400'
              }`}
            >
              {draftAvatar === channelAvatar ? 'Active' : channelHasCustomPhoto ? 'Apply Photo' : 'Apply Avatar'}
            </button>
          </div>
        )}

        {/* Ownership Verification Status & Claim Card */}
        {draftTelegram && isVerifiedOwner && (
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-2xs font-medium text-emerald-400">
            <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
            <span>Verified Channel Owner (@{cleanTelegramChannel(draftTelegram)})</span>
          </div>
        )}

        {draftTelegram && !isVerifiedOwner && cleanTelegramChannel(draftTelegram).length >= 4 && (
          <div className="flex flex-col gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-2xs font-bold text-sky-400">
                <ShieldCheck size={12} />
                Ownership Verification
              </span>
              <span className="text-3xs text-muted">Anti-Spoofing</span>
            </div>
            {!user || user.isGuest ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-3xs leading-relaxed text-muted">
                  Sign in to verify and lock your channel handle so no one else can claim it.
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="self-start inline-flex h-6 items-center justify-center rounded bg-accent-fill px-2 text-2xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
                >
                  Sign In to Verify
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-3xs leading-relaxed text-muted">
                  Post this one-time code in <strong className="text-ink">@{cleanTelegramChannel(draftTelegram)}</strong> to prove ownership. (You can delete the post right after verifying):
                </p>
                <div className="flex items-center gap-1.5 rounded border border-line bg-canvas/80 px-2 py-1">
                  <code className="flex-1 font-mono text-xs font-bold text-accent select-all">{verificationCode}</code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 text-3xs font-semibold text-muted transition-colors hover:text-ink"
                  >
                    {copiedCode ? <Check size={10} className="text-accent" /> : <Copy size={10} />}
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                {verifyError && (
                  <p className="text-3xs font-medium leading-tight text-danger">{verifyError}</p>
                )}
                <button
                  type="button"
                  disabled={verifying}
                  onClick={handleVerifyChannel}
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded bg-sky-500 px-3 text-2xs font-bold text-white transition-colors hover:bg-sky-400 disabled:opacity-50"
                >
                  {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                  {verifying ? 'Checking channel feed...' : 'Verify & Claim Channel'}
                </button>
              </div>
            )}
          </div>
        )}

        {channelFetchStatus === 'not-found' && cleanTelegramChannel(draftTelegram).length >= 4 && (
          <p className="text-2xs text-muted">Channel lookup failed. Try checking the handle spelling.</p>
        )}

        <p className="text-2xs text-muted">
          Shows below your username on the leaderboard with a direct link.
        </p>
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
            <Avatar name={username} channel={effectiveTelegram} src={effectiveAvatar} size="sm" />
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
                  <Avatar name={username} channel={effectiveTelegram} src={effectiveAvatar} />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-full bg-raised text-ink-dim">
                    <UserRound size={16} aria-hidden />
                  </span>
                )}
                <div className="flex min-w-0 flex-col justify-center">
                  <p className="text-sm font-bold text-ink truncate">{username || 'Anonymous coder'}</p>
                  {effectiveTelegram && (
                    <a
                      href={`https://t.me/${cleanTelegramChannel(effectiveTelegram)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/tg inline-flex items-center gap-1 text-2xs text-sky-400 font-mono font-medium hover:underline hover:text-sky-300 transition-colors truncate -mt-0.5"
                    >
                      <svg className="size-2.5 fill-current shrink-0 transition-transform group-hover/tg:scale-110" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.536-.196 1.006.128.832.945z" />
                      </svg>
                      @{cleanTelegramChannel(effectiveTelegram)}
                      {Boolean(user?.telegramVerified) && (
                        <span title="Verified Channel Owner" className="inline-flex items-center">
                          <CheckCircle2 size={10} className="shrink-0 text-sky-400" aria-hidden="true" />
                        </span>
                      )}
                    </a>
                  )}
                  <p className="text-2xs text-muted truncate">
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
                      openAuthModal('signin');
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
    </>
  );
}
