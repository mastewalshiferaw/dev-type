'use client';

import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { ArrowRight, Check, Crown, Flame, Loader2, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import { submitScore } from '@/hooks/useLeaderboard';
import type { Sample } from '@/lib/engine';
import type { RunRecord } from '@/lib/history';
import { usePracticeLogs } from '@/lib/logs';
import { calculateStreak } from '@/lib/streak';
import { languageLabel } from '@/lib/languages';
import { setUsername, USERNAME_HINT, USERNAME_PATTERN, useProfile } from '@/lib/profile';
import { modeKeyLabel } from '@/lib/settings';

// Recharts is heavy and only needed after a run
const WpmChart = dynamic(() => import('@/components/results/WpmChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-60" />,
});

export interface RunResult {
  record: RunRecord;
  samples: Sample[];
  correctChars: number;
  incorrectChars: number;
  /** Too-short runs are shown but not saved or ranked */
  saved: boolean;
  ranked: boolean;
  isPersonalBest: boolean;
  previousBest: RunRecord | null;
}

interface Props {
  result: RunResult;
  onNext: () => void;
  onRetry: () => void;
}

const reveal = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function StatCard({
  label,
  value,
  hint,
  tone = 'text-ink',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <motion.div variants={reveal} className="rounded-lg border border-line bg-canvas/60 px-3 py-3">
      <dt className="label text-muted">{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${tone}`}>{value}</dd>
      {hint && <dd className="text-2xs text-muted">{hint}</dd>}
    </motion.div>
  );
}

const formatTime = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
};

type SubmitState =
  { status: 'idle' } | { status: 'sending' } | { status: 'done' } | { status: 'error'; message: string };

function SubmitScore({ record }: { record: RunRecord }) {
  const { username } = useProfile();
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = username || draft.trim();
    if (!USERNAME_PATTERN.test(name)) {
      setState({ status: 'error', message: USERNAME_HINT });
      return;
    }
    if (!username) setUsername(name);
    setState({ status: 'sending' });
    try {
      await submitScore({
        username: name,
        wpm: record.wpm,
        accuracy: record.accuracy,
        language: record.language === 'custom' ? 'mixed' : record.language,
        modeKey: record.modeKey,
      });
      setState({ status: 'done' });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Submit failed' });
    }
  };

  if (state.status === 'done') {
    return (
      <p role="status" className="flex items-center gap-2 text-xs text-success">
        <Check size={14} aria-hidden />
        Submitted. Your rank is highlighted on the leaderboard.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      {!username && (
        <>
          <label htmlFor="submit-username" className="sr-only">
            Username
          </label>
          <input
            id="submit-username"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Pick a username"
            maxLength={18}
            autoComplete="nickname"
            className="h-9 w-44 rounded-md border border-line-strong bg-canvas px-3 text-xs text-ink transition-ui placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </>
      )}
      <button
        type="submit"
        disabled={state.status === 'sending'}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line-strong px-3 text-xs font-semibold text-ink transition-ui hover:bg-raised disabled:opacity-60"
      >
        {state.status === 'sending' ? (
          <Loader2 size={14} aria-hidden className="animate-spin" />
        ) : (
          <Upload size={14} aria-hidden />
        )}
        {username ? `Submit as ${username}` : 'Submit score'}
      </button>
      {state.status === 'error' && (
        <p role="alert" className="w-full text-xs text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}

export default function ResultsPanel({ result, onNext, onRetry }: Props) {
  const { record, samples, isPersonalBest, previousBest, saved, ranked } = result;
  const panelRef = useRef<HTMLElement>(null);
  const logs = usePracticeLogs();
  const streak = calculateStreak(logs);

  // Focus the panel, not a button: keys still being typed when time runs out must not
  // activate "Next snippet" and throw the results away
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
    if (saved && isPersonalBest && previousBest) {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 }, disableForReducedMotion: true });
    }
  }, [saved, isPersonalBest, previousBest]);

  return (
    <motion.section
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="results-title"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.04 }}
      className="flex w-full flex-col gap-5 rounded-xl border border-line bg-surface p-4 shadow-panel outline-none sm:p-6"
      onKeyDown={(event) => {
        if (event.key === 'Tab' && !event.shiftKey && event.target === event.currentTarget) {
          event.preventDefault();
          onNext();
        }
      }}
    >
      <motion.header variants={reveal} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="results-title" className="text-lg font-bold text-ink">
            Run complete
          </h2>
          <p className="text-xs text-muted">
            {languageLabel(record.language)} · {modeKeyLabel(record.modeKey)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && (
            <p className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <Flame size={14} className="animate-pulse fill-amber-500" />
              {streak.currentStreak} Day Streak 🔥
            </p>
          )}
          {saved && isPersonalBest && (
            <p className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-fill/15 px-3 py-1 text-xs font-semibold text-accent">
              <Crown size={14} aria-hidden />
              {previousBest ? `New personal best (+${record.wpm - previousBest.wpm})` : 'First personal best'}
            </p>
          )}
        </div>
      </motion.header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div
          variants={reveal}
          className="col-span-2 flex items-end gap-6 rounded-lg border border-line bg-canvas/60 px-4 py-3"
        >
          <div>
            <dt className="label text-muted">WPM</dt>
            <dd className="text-5xl font-bold text-accent tabular-nums">{record.wpm}</dd>
          </div>
          <div>
            <dt className="label text-muted">Accuracy</dt>
            <dd className="text-3xl font-bold text-success tabular-nums">{record.accuracy}%</dd>
          </div>
        </motion.div>
        <StatCard label="Raw WPM" value={`${record.raw}`} />
        <StatCard label="Consistency" value={record.consistency === null ? '–' : `${record.consistency}%`} />
        <StatCard
          label="Errors"
          value={`${record.errors}`}
          tone={record.errors > 0 ? 'text-danger' : 'text-ink'}
        />
        <StatCard label="Time" value={formatTime(record.durationMs)} />
        <StatCard
          label="Characters"
          value={`${result.correctChars}/${result.incorrectChars}`}
          hint="correct / incorrect"
        />
        <StatCard
          label="Personal best"
          value={previousBest && !isPersonalBest ? `${previousBest.wpm}` : `${record.wpm}`}
          hint={modeKeyLabel(record.modeKey)}
        />
      </dl>

      <motion.div variants={reveal}>
        <WpmChart samples={samples} />
      </motion.div>

      <motion.div variants={reveal} className="flex flex-col gap-3 border-t border-line pt-4">
        {!saved ? (
          <p className="text-xs text-muted">This run was too short to save. Type for a few seconds longer.</p>
        ) : ranked ? (
          <SubmitScore record={record} />
        ) : (
          <p className="text-xs text-muted">Zen and custom runs stay on your device and are not ranked.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onNext}
            aria-keyshortcuts="Tab"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent-fill px-4 text-sm font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover active:scale-[0.99]"
          >
            Next snippet
            <ArrowRight size={16} aria-hidden />
            <span className="hidden sm:inline">
              <kbd className="rounded-sm border border-accent-ink/30 px-1.5 py-px text-2xs">Tab</kbd>
            </span>
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line-strong px-4 text-sm text-ink-dim transition-ui hover:bg-raised hover:text-ink active:scale-[0.99]"
          >
            <RotateCcw size={14} aria-hidden />
            Try again
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
