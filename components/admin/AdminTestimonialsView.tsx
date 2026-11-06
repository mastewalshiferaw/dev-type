'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  MessageSquareQuote,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/lib/auth';
import { isUserAdmin } from '@/lib/auth/admin';
import {
  fetchAdminTestimonials,
  updateAdminTestimonialStatus,
  deleteAdminTestimonial,
  type Testimonial,
  type TestimonialStatus,
} from '@/lib/testimonials';

type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminTestimonialsView() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = isUserAdmin(user);

  const [filter, setFilter] = useState<FilterTab>('pending');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [serviceRoleWarning, setServiceRoleWarning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [, startTransition] = useTransition();

  const loadData = async (activeFilter: FilterTab = filter) => {
    setLoading(true);
    setFeedback(null);
    const res = await fetchAdminTestimonials(activeFilter);
    setLoading(false);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setTestimonials(res.testimonials);
      setCounts(res.counts);
      setServiceRoleWarning(res.warning || null);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

    let cancelled = false;
    fetchAdminTestimonials(filter).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setTestimonials(res.testimonials);
        setCounts(res.counts);
        setServiceRoleWarning(res.warning || null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, filter]);

  const handleStatusChange = async (id: string, newStatus: TestimonialStatus) => {
    setActionLoadingId(id);
    setFeedback(null);

    // Optimistic update
    setTestimonials((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        .filter((t) => filter === 'all' || t.status === filter)
    );

    const res = await updateAdminTestimonialStatus(id, newStatus);
    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
      loadData(filter); // Revert on failure
    } else {
      setFeedback({
        type: 'success',
        message: `Testimonial successfully marked as ${newStatus}!`,
      });
      // Refresh count numbers in background
      startTransition(() => {
        fetchAdminTestimonials('all').then((r) => {
          if (r.counts) setCounts(r.counts);
        });
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the testimonial by "${name}"?`)) {
      return;
    }

    setActionLoadingId(id);
    setFeedback(null);

    const res = await deleteAdminTestimonial(id);
    setActionLoadingId(null);

    if (res.error) {
      setFeedback({ type: 'error', message: res.error });
    } else {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      setFeedback({ type: 'success', message: 'Testimonial deleted permanently.' });
      startTransition(() => {
        fetchAdminTestimonials('all').then((r) => {
          if (r.counts) setCounts(r.counts);
        });
      });
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="rounded-2xl h-64" />
      </div>
    );
  }

  if (!user || user.isGuest) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-line bg-surface text-muted shadow-panel">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-bold text-ink">Authentication Required</h1>
        <p className="mt-2 text-sm text-muted">
          You must be signed in with an administrator account to review and moderate testimonials.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent-fill px-4 text-xs font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
          >
            Go to Sign In
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-medium text-ink transition-ui hover:bg-raised"
          >
            Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-danger/30 bg-danger/10 text-danger shadow-panel">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-bold text-ink">Admin Privileges Required</h1>
        <p className="mt-2 text-sm text-muted">
          Your current account (<span className="font-semibold text-ink">{user.email}</span>) is not
          configured as an admin.
        </p>
        <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-left font-mono text-xs text-muted">
          <p className="font-sans font-semibold text-ink">To grant admin rights:</p>
          <p className="mt-1">Add your email to your environment configuration:</p>
          <code className="rounded mt-2 block bg-raised p-2 text-accent">
            NEXT_PUBLIC_ADMIN_EMAILS={user.email}
          </code>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/account"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-xs font-medium text-ink transition-ui hover:bg-raised"
          >
            <ArrowLeft size={14} />
            Back to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/account" className="inline-flex items-center gap-1 transition-ui hover:text-ink">
            <ArrowLeft size={14} />
            Account
          </Link>
          <span>/</span>
          <span className="font-semibold text-ink">Admin Moderation</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/#testimonials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-muted transition-ui hover:bg-raised hover:text-ink"
          >
            <ExternalLink size={13} />
            <span>View Live on Homepage</span>
          </Link>
          <button
            type="button"
            onClick={() => loadData(filter)}
            disabled={loading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-muted transition-ui hover:bg-raised hover:text-ink disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl relative overflow-hidden border border-line bg-surface p-6 shadow-panel">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-fill/10 px-2.5 py-0.5 text-xs font-bold text-accent">
              <ShieldCheck size={14} />
              Admin Portal
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Testimonials Moderation</h1>
            <p className="mt-1 text-sm text-muted">
              Approve community testimonials to feature them live on the homepage, or reject spam submissions.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-raised/50 p-3 text-xs sm:flex-col sm:items-end">
            <span className="text-muted">Moderator:</span>
            <span className="font-semibold text-ink">{user.email || user.username}</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 rounded-xl border p-3 text-xs ${
              feedback.type === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <div className="mr-2 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted uppercase">
          <Filter size={13} />
          <span>Status:</span>
        </div>

        {(
          [
            { id: 'pending', label: 'Pending Review', count: counts.pending, color: 'text-amber-500' },
            { id: 'approved', label: 'Approved & Live', count: counts.approved, color: 'text-emerald-500' },
            { id: 'rejected', label: 'Rejected', count: counts.rejected, color: 'text-rose-500' },
            { id: 'all', label: 'All Submissions', count: counts.all, color: 'text-muted' },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilter(tab.id);
                setLoading(true);
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-ui ${
                isActive
                  ? 'bg-accent-fill text-accent-ink shadow-sm'
                  : 'border border-line bg-surface text-muted hover:bg-raised hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`py-0.2 rounded-full px-1.5 font-mono text-3xs font-bold ${
                  isActive ? 'bg-accent-ink/20 text-accent-ink' : 'bg-raised text-ink'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
          <MessageSquareQuote size={40} className="text-muted/40" />
          <h3 className="mt-3 text-base font-bold text-ink">No testimonials found</h3>
          <p className="mt-1 max-w-sm text-xs text-muted">
            {filter === 'pending'
              ? 'There are currently no pending testimonials visible.'
              : `There are currently no testimonials with status "${filter}".`}
          </p>

          {serviceRoleWarning && (
            <div className="mt-6 max-w-lg rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-xs text-ink">
              <div className="flex items-center gap-2 font-semibold text-amber-500">
                <ShieldAlert size={16} />
                <span>Notice: Service Role Key Recommended</span>
              </div>
              <p className="mt-2 leading-relaxed text-muted">
                Supabase database Row-Level Security (RLS) hides other users&apos; pending submissions from
                the public client.
              </p>
              <div className="mt-3 space-y-2">
                <p className="font-semibold text-ink">To enable full moderation access, choose either:</p>
                <div className="rounded bg-raised p-2 font-mono text-2xs">
                  <span className="text-muted">Option 1: Add to your .env.local (and Vercel):</span>
                  <br />
                  <span className="text-accent">SUPABASE_SERVICE_ROLE_KEY=&lt;service-role-secret&gt;</span>
                  <br />
                  <span className="text-muted">(Supabase Dashboard &gt; Project Settings &gt; API Keys)</span>
                </div>
                <div className="rounded bg-raised p-2 font-mono text-2xs">
                  <span className="text-muted">Option 2: Run the updated SQL in Supabase SQL Editor:</span>
                  <br />
                  <span className="text-accent">
                    supabase/migrations/20261102000002_admin_testimonials_policy.sql
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {testimonials.map((t) => {
            const isBusy = actionLoadingId === t.id;

            return (
              <div
                key={t.id}
                className="group rounded-2xl relative flex flex-col justify-between gap-4 border border-line bg-surface p-5 shadow-panel transition-ui hover:border-line-strong sm:flex-row sm:items-start"
              >
                {/* Left: User details & quote */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={t.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{t.name}</span>
                        {t.isVerified && (
                          <span className="rounded inline-flex items-center bg-accent-fill/15 px-1.5 py-0.5 text-3xs font-semibold text-accent">
                            Verified User
                          </span>
                        )}
                        {t.wpmRecord !== undefined && (
                          <span className="rounded inline-flex items-center bg-raised px-1.5 py-0.5 font-mono text-3xs font-bold text-muted">
                            ⚡ {t.wpmRecord} WPM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">{t.role}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="ml-auto sm:ml-0">
                      {t.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-3xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} />
                          Featured Live
                        </span>
                      )}
                      {t.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-3xs font-bold text-amber-600 dark:text-amber-400">
                          <Clock size={12} />
                          Under Review
                        </span>
                      )}
                      {t.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-3xs font-bold text-rose-600 dark:text-rose-400">
                          <XCircle size={12} />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quote block */}
                  <blockquote className="mt-3.5 border-l-2 border-accent/40 pl-3.5 font-sans text-sm leading-relaxed text-ink-dim italic">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  {t.createdAt && (
                    <p className="mt-3 font-mono text-3xs text-muted">
                      Submitted:{' '}
                      {new Date(t.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex flex-row items-center gap-2 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                  {t.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusChange(t.id, 'approved')}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition-ui hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve</span>
                    </button>
                  )}

                  {t.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusChange(t.id, 'rejected')}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-rose-600 transition-ui hover:border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                    >
                      <XCircle size={13} />
                      <span>Reject</span>
                    </button>
                  )}

                  {t.status !== 'pending' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleStatusChange(t.id, 'pending')}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-medium text-muted transition-ui hover:bg-raised hover:text-ink disabled:opacity-50"
                    >
                      <Clock size={13} />
                      <span>Revert to Pending</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDelete(t.id, t.name)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted/60 transition-ui hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    title="Delete permanently"
                  >
                    <Trash2 size={13} />
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
