'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Check, Flame, Loader2, Lock, Mail, User, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { signInAsGuest, signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { USERNAME_HINT, USERNAME_PATTERN } from '@/lib/profile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onOpenChange, defaultMode = 'signin' }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (mode === 'signup' && username) {
      if (!USERNAME_PATTERN.test(username.trim())) {
        setError(USERNAME_HINT);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onOpenChange(false);
        }
      } else {
        const res = await signUpWithEmail(email, password, username);
        if (res.error) {
          setError(res.error);
        } else if (res.needsConfirmation) {
          setSuccessMessage('Account created! Please check your email to confirm your registration.');
        } else {
          onOpenChange(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    signInAsGuest();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-backdrop/60 backdrop-blur-xs" />
        <Dialog.Content className="rounded-2xl fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-line bg-surface p-6 shadow-modal focus:outline-none data-[state=open]:animate-pop">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent-fill/15 text-accent">
                <Flame size={18} className="animate-pulse" />
              </span>
              <div>
                <Dialog.Title className="text-base font-bold text-ink">
                  {mode === 'signin' ? 'Sign In to DEV_TYPE' : 'Create an Account'}
                </Dialog.Title>
                <Dialog.Description className="text-2xs text-muted">
                  Keep your streaks, GitHub activity blocks, and practice logs synced
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-md text-muted transition-ui hover:bg-raised hover:text-ink"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-4 flex rounded-lg border border-line bg-canvas p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-ui ${
                mode === 'signin' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-ui ${
                mode === 'signup' ? 'bg-surface text-ink shadow-xs' : 'text-muted hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              <Check size={16} className="mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label
                  className="text-2xs font-semibold tracking-wider text-muted uppercase"
                  htmlFor="auth-username"
                >
                  Username (optional)
                </label>
                <div className="relative">
                  <User size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rust_ace"
                    maxLength={18}
                    className="h-9 w-full rounded-md border border-line-strong bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label
                className="text-2xs font-semibold tracking-wider text-muted uppercase"
                htmlFor="auth-email"
              >
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  autoComplete="email"
                  className="h-9 w-full rounded-md border border-line-strong bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                className="text-2xs font-semibold tracking-wider text-muted uppercase"
                htmlFor="auth-password"
              >
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="h-9 w-full rounded-md border border-line-strong bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover disabled:opacity-50"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2">
            <span className="h-px flex-1 bg-line" />
            <span className="text-2xs text-muted uppercase">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md border border-line bg-canvas text-xs font-medium text-ink transition-ui hover:bg-raised"
          >
            Continue as Guest (Local Only)
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
