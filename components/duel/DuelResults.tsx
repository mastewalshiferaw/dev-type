'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, GitMerge, RotateCcw, Home, CheckCircle2, XCircle } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import type { DuelPlayer } from '@/lib/duel/types';
import Link from 'next/link';

interface DuelResultsProps {
  localPlayer: DuelPlayer;
  opponent?: DuelPlayer | null;
  winnerId: string | null;
  onRematch: () => void;
}

export default function DuelResults({ localPlayer, opponent, winnerId, onRematch }: DuelResultsProps) {
  const isWinner = winnerId === localPlayer.id;
  const isTie = !winnerId;

  // Trigger confetti burst on victory
  useEffect(() => {
    if (isWinner && typeof window !== 'undefined') {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      });
    }
  }, [isWinner]);

  const localStats = localPlayer.stats || {
    wpm: localPlayer.wpm,
    raw: localPlayer.wpm,
    accuracy: 100,
    durationMs: 0,
  };

  const opponentStats = opponent?.stats || {
    wpm: opponent?.wpm || 0,
    raw: opponent?.wpm || 0,
    accuracy: 100,
    durationMs: 0,
  };

  const wpmDiff = localStats.wpm - opponentStats.wpm;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 py-8">
      {/* Result Announcement */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div
          className={`rounded-2xl flex size-16 items-center justify-center shadow-lg ${
            isWinner ? 'bg-success/15 text-success shadow-success/10' : 'bg-muted/15 text-muted shadow-line'
          }`}
        >
          {isWinner ? <Trophy size={32} /> : <GitMerge size={32} />}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {isWinner ? 'Commit Merged into Main!' : isTie ? 'Neck and Neck Draw!' : 'Merge Conflict Detected!'}
        </h1>

        <p className="max-w-md font-mono text-sm text-muted">
          {isWinner
            ? 'Your commit was pushed first without conflict. Perfect execution!'
            : isTie
              ? 'Both developers pushed at nearly the exact same millisecond.'
              : `${opponent?.username ?? 'Opponent'}'s commit was merged ahead of yours.`}
        </p>
      </motion.div>

      {/* Head-to-Head Comparison Card */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Local Player Card */}
        <div
          className={`rounded-2xl flex flex-col gap-4 border p-6 ${
            isWinner ? 'border-success/60 bg-success/5 shadow-sm' : 'border-line bg-surface/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={localPlayer.username} src={localPlayer.avatarUrl} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{localPlayer.username}</span>
                  <span className="rounded py-0.2 bg-accent/15 px-1.5 font-mono text-2xs font-medium text-accent">
                    YOU
                  </span>
                </div>
                <div className="font-mono text-xs text-muted">{isWinner ? 'Winner 🥇' : 'Runner-up 🥈'}</div>
              </div>
            </div>

            {isWinner ? (
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-success">
                <CheckCircle2 size={16} /> WINNER
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-muted">
                <XCircle size={16} /> 2ND PLACE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">NET SPEED</div>
              <div className="text-2xl font-black text-ink">{localStats.wpm}</div>
              <div className="text-2xs text-muted">WPM</div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">ACCURACY</div>
              <div className="text-2xl font-black text-ink">{Math.round(localStats.accuracy)}%</div>
              <div className="text-2xs text-muted">ACC</div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">DURATION</div>
              <div className="text-lg font-bold text-ink">{(localStats.durationMs / 1000).toFixed(1)}s</div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">RAW SPEED</div>
              <div className="text-lg font-bold text-ink">{localStats.raw} WPM</div>
            </div>
          </div>
        </div>

        {/* Opponent Card */}
        <div
          className={`rounded-2xl flex flex-col gap-4 border p-6 ${
            !isWinner && !isTie ? 'border-success/60 bg-success/5 shadow-sm' : 'border-line bg-surface/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={opponent?.username ?? 'Opponent'} src={opponent?.avatarUrl} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{opponent?.username ?? 'Opponent'}</span>
                  {opponent?.isBot && (
                    <span className="rounded py-0.2 bg-accent/15 px-1.5 font-mono text-2xs font-medium text-accent">
                      BOT
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-muted">
                  {!isWinner && !isTie ? 'Winner 🥇' : 'Runner-up 🥈'}
                </div>
              </div>
            </div>

            {!isWinner && !isTie ? (
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-success">
                <CheckCircle2 size={16} /> WINNER
              </span>
            ) : (
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-muted">
                <XCircle size={16} /> 2ND PLACE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">NET SPEED</div>
              <div className="text-2xl font-black text-ink">{opponentStats.wpm}</div>
              <div className="text-2xs text-muted">WPM</div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">ACCURACY</div>
              <div className="text-2xl font-black text-ink">{Math.round(opponentStats.accuracy)}%</div>
              <div className="text-2xs text-muted">ACC</div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">DURATION</div>
              <div className="text-lg font-bold text-ink">
                {(opponentStats.durationMs / 1000).toFixed(1)}s
              </div>
            </div>

            <div className="rounded-xl border border-line bg-canvas/60 p-3">
              <div className="text-2xs text-muted">RAW SPEED</div>
              <div className="text-lg font-bold text-ink">{opponentStats.raw} WPM</div>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Delta Pill */}
      <div className="rounded-full border border-line bg-surface/80 px-4 py-1.5 font-mono text-xs">
        {wpmDiff > 0 ? (
          <span className="text-success">
            ⚡ You typed <span className="font-bold">+{wpmDiff} WPM</span> faster!
          </span>
        ) : wpmDiff < 0 ? (
          <span className="text-danger">
            Opponent typed <span className="font-bold">+{Math.abs(wpmDiff)} WPM</span> faster.
          </span>
        ) : (
          <span className="text-muted">Exact speed tie!</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRematch}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-fill px-6 text-sm font-bold text-accent-ink shadow-md transition-ui hover:bg-accent-fill-hover"
        >
          <RotateCcw size={16} />
          <span>Commit Rematch</span>
        </button>

        <Link
          href="/play"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-raised/70 px-5 text-sm font-semibold text-ink transition-ui hover:bg-raised"
        >
          <Home size={16} />
          <span>Practice Solo</span>
        </Link>
      </div>
    </div>
  );
}
