'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, Check, Flame, KeyRound, Loader2, Lock, Mail, MailCheck, User, X } from 'lucide-react';
import { useState, useEffect, type FormEvent } from 'react';
import {
  isDisposableOrFakeEmail,
  signInAsGuest,
  signInWithEmail,
  signUpWithEmail,
  requestPasswordReset,
  updateUserPassword,
  resolveRecoverySession,
  useAuthModal,
  closeAuthModal,
  type AuthModalMode,
} from '@/lib/auth';
import { USERNAME_HINT, USERNAME_PATTERN } from '@/lib/profile';

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: AuthModalMode;
}

export default function AuthModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultMode = 'signin',
}: Props) {
  const globalModal = useAuthModal();
  const isOpen = (controlledOpen !== undefined && controlledOpen) || globalModal.open;

  const [mode, setMode] = useState<AuthModalMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  // When update_password mode is active, verify that an authenticated session exists or exchange token
  useEffect(() => {
    if (isOpen && mode === 'update_password') {
      let cancelled = false;
      setVerifyingSession(true);
      setError(null);
      resolveRecoverySession().then((res) => {
        if (cancelled) return;
        setVerifyingSession(false);
        if (!res.success) {
          setSessionValid(false);
          setError(res.error || 'Your password reset link is invalid or has expired.');
        } else {
          setSessionValid(true);
        }
      });
      return () => {
        cancelled = true;
      };
    } else {
      setSessionValid(null);
      setVerifyingSession(false);
    }
  }, [isOpen, mode]);

  // Sync mode when global modal triggers
  useEffect(() => {
    if (globalModal.open) {
      setMode(globalModal.mode);
      setError(null);
      setSuccessMessage(null);
      setResetEmailSent(false);
    }
  }, [globalModal.open, globalModal.mode]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
      setSuccessMessage(null);
      setConfirmationEmail(null);
      setResetEmailSent(false);
      setSessionValid(null);
      setVerifyingSession(false);
      setPassword('');
      setConfirmPassword('');
      closeAuthModal();
    } else {
      setMode(defaultMode);
    }
    setControlledOpen?.(nextOpen);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 1. Password Reset Request Mode
    if (mode === 'forgot') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.trim())) {
        setError('Please enter a valid email address');
        return;
      }
      setLoading(true);
      try {
        const res = await requestPasswordReset(email);
        if (res.error) {
          setError(res.error);
        } else {
          setResetEmailSent(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send reset link');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Set New Password Mode
    if (mode === 'update_password') {
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        const res = await updateUserPassword(password);
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Password updated successfully! You can now continue.');
          setTimeout(() => {
            handleOpenChange(false);
          }, 1800);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update password');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Sign In & Sign Up Modes
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'signup' && isDisposableOrFakeEmail(email.trim())) {
      setError(
        'Please enter a real email, or choose Continue as Guest below if you do not want to use an email.'
      );
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const cleanUsername = username ? username.trim().replace(/\s+/g, '_') : '';
    if (mode === 'signup' && cleanUsername) {
      if (!USERNAME_PATTERN.test(cleanUsername)) {
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
          handleOpenChange(false);
        }
      } else {
        const res = await signUpWithEmail(email, password, cleanUsername || undefined);
        if (res.error) {
          setError(res.error);
        } else if (res.needsConfirmation) {
          setConfirmationEmail(email.trim());
        } else {
          handleOpenChange(false);
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
    handleOpenChange(false);
  };

  const modalTitle =
    mode === 'forgot'
      ? 'Reset Your Password'
      : mode === 'update_password'
        ? 'Set New Password'
        : mode === 'signin'
          ? 'Sign In to DEV_TYPE'
          : 'Create an Account';

  const modalDescription =
    mode === 'forgot'
      ? 'Enter your email to receive a recovery link'
      : mode === 'update_password'
        ? 'Choose a new password for your account'
        : 'Keep your streaks, and practice logs synced';

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-fade fixed inset-0 z-50 bg-backdrop/60 backdrop-blur-xs" />
        <Dialog.Content className="rounded-2xl fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-line bg-surface p-6 shadow-modal focus:outline-none data-[state=open]:animate-pop">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-accent-fill/15 text-accent">
                {mode === 'forgot' || mode === 'update_password' ? (
                  <KeyRound size={18} />
                ) : (
                  <Flame size={18} className="animate-pulse" />
                )}
              </span>
              <div>
                <Dialog.Title className="text-base font-bold text-ink">{modalTitle}</Dialog.Title>
                <Dialog.Description className="text-2xs text-muted">
                  {modalDescription}
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

          {confirmationEmail ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="rounded-2xl flex size-12 items-center justify-center border border-accent/30 bg-accent-fill/15 text-accent shadow-sm">
                <MailCheck size={26} />
              </div>
              <h3 className="mt-3 text-base font-bold text-ink">Check Your Inbox</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                We sent a confirmation link to{' '}
                <span className="font-semibold text-ink">{confirmationEmail}</span>. Click the link in the
                email to activate your account.
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationEmail(null);
                    setMode('signin');
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
                >
                  Go to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmationEmail(null)}
                  className="inline-flex h-8 w-full items-center justify-center text-xs text-muted transition-ui hover:text-ink"
                >
                  Try another email
                </button>
              </div>
            </div>
          ) : mode === 'forgot' && resetEmailSent ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="rounded-2xl flex size-12 items-center justify-center border border-accent/30 bg-accent-fill/15 text-accent shadow-sm">
                <MailCheck size={26} />
              </div>
              <h3 className="mt-3 text-base font-bold text-ink">Reset Link Sent</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                We sent a password recovery link to{' '}
                <span className="font-semibold text-ink">{email}</span>. Click the link in your email to choose a new password.
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmailSent(false);
                    setMode('signin');
                    setError(null);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
                >
                  Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setResetEmailSent(false)}
                  className="inline-flex h-8 w-full items-center justify-center text-xs text-muted transition-ui hover:text-ink"
                >
                  Send to another email
                </button>
              </div>
            </div>
          ) : mode === 'update_password' && verifyingSession ? (
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
              <Loader2 size={24} className="animate-spin text-accent" />
              <p className="mt-3 text-xs font-medium text-ink">Verifying Reset Link...</p>
              <p className="mt-1 text-2xs text-muted">Establishing secure recovery session</p>
            </div>
          ) : mode === 'update_password' && sessionValid === false ? (
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="rounded-2xl flex size-12 items-center justify-center border border-danger/30 bg-danger/10 text-danger shadow-sm">
                <KeyRound size={24} />
              </div>
              <h3 className="mt-3 text-base font-bold text-ink">Reset Link Invalid or Expired</h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                {error || 'This recovery link is invalid or has already expired. Please request a fresh reset link below.'}
              </p>
              <div className="mt-5 flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSessionValid(null);
                    setMode('forgot');
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
                >
                  Request a New Link
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="inline-flex h-8 w-full items-center justify-center text-xs text-muted transition-ui hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switch Tabs only for signin and signup */}
              {(mode === 'signin' || mode === 'signup') && (
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
              )}

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
                {/* Signup Username */}
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

                {/* Email Field (for signin, signup, forgot) */}
                {mode !== 'update_password' && (
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-2xs font-semibold tracking-wider text-muted uppercase"
                      htmlFor="auth-email"
                    >
                      Email{' '}
                      {mode === 'signup' && (
                        <span className="font-normal text-muted normal-case">(for device sync)</span>
                      )}
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
                )}

                {/* Password Field for signin and signup */}
                {(mode === 'signin' || mode === 'signup') && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label
                        className="text-2xs font-semibold tracking-wider text-muted uppercase"
                        htmlFor="auth-password"
                      >
                        Password
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot');
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="text-2xs font-semibold text-accent hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
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
                )}

                {/* New Password & Confirm Password for update_password */}
                {mode === 'update_password' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-2xs font-semibold tracking-wider text-muted uppercase"
                        htmlFor="auth-new-password"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                        <input
                          id="auth-new-password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          autoComplete="new-password"
                          className="h-9 w-full rounded-md border border-line-strong bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-2xs font-semibold tracking-wider text-muted uppercase"
                        htmlFor="auth-confirm-password"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                        <input
                          id="auth-confirm-password"
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          autoComplete="new-password"
                          className="h-9 w-full rounded-md border border-line-strong bg-canvas pr-3 pl-9 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Create Account'
                      : mode === 'forgot'
                        ? 'Send Recovery Link'
                        : 'Update Password'}
                </button>

                {/* Back to sign in link for forgot mode */}
                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Back to Sign In
                  </button>
                )}
              </form>

              {/* Guest Option for signin and signup */}
              {(mode === 'signin' || mode === 'signup') && (
                <>
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
                    Continue as Guest (No email required)
                  </button>

                  <p className="mt-3 text-center text-2xs text-muted">
                    Guest mode saves runs locally and lets you compete on the leaderboard freely.
                  </p>
                </>
              )}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
