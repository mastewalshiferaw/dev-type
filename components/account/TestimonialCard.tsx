'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck, CheckCircle2, Clock, MessageSquareQuote, Send, ShieldCheck, Trash2, Edit3, AlertCircle } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import type { AuthUser } from '@/lib/auth/types';
import { isUserAdmin } from '@/lib/auth/admin';
import {
  getUserTestimonial,
  submitUserTestimonial,
  deleteUserTestimonial,
  type Testimonial,
} from '@/lib/testimonials';

interface TestimonialCardProps {
  user: AuthUser | null;
  bestWpm: number;
  totalRuns: number;
  onOpenAuth: () => void;
}

export default function TestimonialCard({
  user,
  bestWpm,
  totalRuns,
  onOpenAuth,
}: TestimonialCardProps) {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState('Software Engineer');
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isVerified = Boolean(user && !user.isGuest);

  useEffect(() => {
    if (!user || user.isGuest) return;

    let active = true;
    getUserTestimonial(user.id).then((item) => {
      if (!active) return;
      if (item) {
        setTestimonial(item);
        setRole(item.role);
        setQuote(item.quote);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isGuest) return;

    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    const res = await submitUserTestimonial(user.id, user.username, {
      role,
      quote,
      wpmRecord: bestWpm > 0 ? bestWpm : undefined,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.testimonial) {
      setTestimonial(res.testimonial);
      setIsEditing(false);
      setSuccessMessage('Thank you! Your testimonial has been submitted for review.');
    }
  };

  const handleDelete = async () => {
    if (!user || !testimonial) return;
    if (!confirm('Are you sure you want to remove your testimonial?')) return;

    setSubmitting(true);
    const res = await deleteUserTestimonial(user.id);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setTestimonial(null);
      setQuote('');
      setIsEditing(false);
      setSuccessMessage('Your testimonial has been removed.');
    }
  };

  if (!isVerified) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl flex size-10 items-center justify-center bg-accent-fill/10 text-accent">
              <MessageSquareQuote size={22} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Give a Verified Testimonial</h3>
              <p className="text-xs text-muted">
                Sign in to submit your quote and get featured on the DevType homepage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover shrink-0"
          >
            Sign In to Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-panel">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <MessageSquareQuote size={18} className="text-accent" />
          <h3 className="text-sm font-bold text-ink">Community Testimonial</h3>
          <span className="text-3xs inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 font-bold text-success">
            <BadgeCheck size={11} />
            Verified
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isUserAdmin(user) && (
            <Link
              href="/admin/testimonials"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-ui hover:underline"
            >
              <ShieldCheck size={13} />
              <span className="hidden sm:inline">Admin:</span> Moderate Submissions
            </Link>
          )}
          {testimonial && !isEditing && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-muted transition-ui hover:text-ink"
              >
                <Edit3 size={13} />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="inline-flex items-center gap-1 text-xs text-danger/80 transition-ui hover:text-danger"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-xs text-muted">Checking testimonial status...</div>
      ) : testimonial && !isEditing ? (
        /* Status Display */
        <div className="mt-4 flex flex-col gap-4">
          <div
            className={`rounded-lg border px-3 py-2.5 text-xs flex items-center gap-2.5 ${
              testimonial.status === 'approved'
                ? 'border-success/30 bg-success/10 text-success'
                : testimonial.status === 'rejected'
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {testimonial.status === 'approved' ? (
              <>
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  <strong>Featured Live!</strong> Your testimonial is approved and visible on the DevType homepage.
                </span>
              </>
            ) : testimonial.status === 'rejected' ? (
              <>
                <AlertCircle size={16} className="shrink-0" />
                <span>Your testimonial was not approved. You can edit and re-submit it below.</span>
              </>
            ) : (
              <>
                <Clock size={16} className="shrink-0" />
                <span>
                  <strong>Under Review:</strong> We review testimonials to prevent spam. Once approved, it will appear on the homepage.
                </span>
              </>
            )}
          </div>

          {/* Testimonial Preview Card */}
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <blockquote className="font-sans text-sm text-ink-dim italic">
              &ldquo;{testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={user?.username || 'User'} size="sm" />
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink">
                    {user?.username}
                    <BadgeCheck size={12} className="text-accent" />
                  </span>
                  <span className="text-3xs text-muted">{testimonial.role}</span>
                </div>
              </div>
              {bestWpm > 0 && (
                <span className="text-3xs rounded-full border border-line bg-surface px-2.5 py-1 font-mono font-bold text-ink">
                  ⚡ {bestWpm} WPM
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Submission / Edit Form */
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <p className="text-xs text-muted">
            Share how DevType has helped your muscle memory, syntax speed, or daily workflow.
          </p>

          <div>
            <label htmlFor="test-role" className="text-3xs block font-bold uppercase tracking-wider text-muted">
              Your Title / Role
            </label>
            <input
              id="test-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Backend Developer, Student, Rustacean"
              maxLength={50}
              required
              className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="test-quote" className="text-3xs block font-bold uppercase tracking-wider text-muted">
                Your Testimonial (15 – 280 characters)
              </label>
              <span className={`text-3xs tabular-nums ${quote.length > 280 ? 'text-danger font-bold' : 'text-muted'}`}>
                {quote.length}/280
              </span>
            </div>
            <textarea
              id="test-quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="What do you enjoy most about practicing code typing on DevType?"
              rows={3}
              minLength={15}
              maxLength={280}
              required
              className="mt-1 w-full rounded-md border border-line bg-canvas p-2.5 text-xs text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-3xs text-muted">
              {bestWpm > 0 ? `Includes your high score badge: ${bestWpm} WPM` : `${totalRuns} completed runs`}
            </div>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-ui hover:text-ink"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || quote.trim().length < 15 || quote.length > 280}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-fill px-4 py-1.5 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover disabled:opacity-50"
              >
                <Send size={13} />
                {submitting ? 'Submitting...' : isEditing ? 'Update Testimonial' : 'Submit for Review'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
