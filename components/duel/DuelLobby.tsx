'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Copy,
  Check,
  GitCommit,
  GitPullRequest,
  Users,
  Bot,
  Code2,
  Share2,
} from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import { LANGUAGE_FILTER_OPTIONS } from '@/lib/languages';
import type { LanguageId } from '@/lib/languages';
import type { DuelPlayer } from '@/lib/duel/types';
import Select from '@/components/ui/Select';

interface DuelLobbyProps {
  roomId: string;
  localPlayer: DuelPlayer;
  opponent?: DuelPlayer | null;
  language: LanguageId;
  isHost: boolean;
  botActive: boolean;
  botWpm: number;
  countdown: number;
  phase: 'lobby' | 'countdown';
  onToggleCommit: () => void;
  onChangeLanguage: (lang: LanguageId) => void;
  onToggleBot: (active?: boolean, wpm?: number) => void;
  onSetBotWpm: (wpm: number) => void;
}

export default function DuelLobby({
  roomId,
  localPlayer,
  opponent,
  language,
  isHost,
  botActive,
  botWpm,
  countdown,
  phase,
  onToggleCommit,
  onChangeLanguage,
  onToggleBot,
  onSetBotWpm,
}: DuelLobbyProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const duelUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/duel?room=${roomId}` : `/duel?room=${roomId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(duelUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const isCountingDown = phase === 'countdown';
  const bothCommitted = localPlayer.committed && opponent?.committed;

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 py-6">
      {/* Countdown overlay */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/85 backdrop-blur-md"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <span className="font-mono text-8xl font-black tracking-tight text-accent">
                {countdown > 0 ? countdown : 'COMMIT!'}
              </span>
              <p className="font-mono text-xl text-muted">
                {countdown > 0 ? 'Commits locked in. Ready to race...' : 'RACE STARTED!'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Badge */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-1 font-mono text-xs text-muted">
          <GitPullRequest size={14} className="text-accent" />
          <span>1v1 Git Commit Duel</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Commit & Race</h1>
        <p className="max-w-lg text-sm text-muted">
          Two developers race head-to-head on the same code snippet in real-time. Both players must{' '}
          <span className="font-semibold text-accent">commit</span> to initiate the match.
        </p>
      </div>

      {/* Room Share Card */}
      <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface/70 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-line-strong bg-raised font-mono font-bold text-accent">
            #
          </div>
          <div>
            <div className="font-mono text-xs text-muted">ROOM CODE</div>
            <div className="flex items-center gap-2 font-mono text-lg font-bold text-ink">
              {roomId}
              <button
                type="button"
                onClick={copyCode}
                className="rounded p-1 text-muted transition-ui hover:bg-raised hover:text-ink"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={16} className="text-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <div className="flex items-center gap-2">
              <Select
                label="Language"
                icon={Code2}
                value={language}
                options={LANGUAGE_FILTER_OPTIONS}
                onChange={(val) => onChangeLanguage(val as LanguageId)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={copyLink}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-raised/70 px-3.5 text-xs font-semibold text-ink transition-ui hover:border-line-hover hover:bg-raised"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-success" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-accent" />
                <span>Share Invite Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Player Battle Cards */}
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {/* Player 1 (You) */}
        <div
          className={`rounded-2xl relative flex flex-col gap-4 border p-5 transition-all ${
            localPlayer.committed
              ? 'border-accent/80 bg-accent/5 shadow-md shadow-accent/5'
              : 'border-line bg-surface/60'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={localPlayer.username} src={localPlayer.avatarUrl} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{localPlayer.username}</span>
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-2xs font-medium text-accent">
                    YOU
                  </span>
                  {localPlayer.isHost && (
                    <span className="rounded border border-line px-1.5 py-0.5 font-mono text-2xs text-muted">
                      HOST
                    </span>
                  )}
                </div>
                <div className="font-mono text-xs text-muted">Ready to race</div>
              </div>
            </div>

            {/* Commit Badge */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium ${
                localPlayer.committed ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
              }`}
            >
              {localPlayer.committed ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>COMMITTED</span>
                </>
              ) : (
                <>
                  <GitCommit size={13} />
                  <span>UNCOMMITTED</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-line/60 bg-canvas/60 p-3 font-mono text-xs text-muted">
            <span className="text-accent">$</span> git status
            <br />
            {localPlayer.committed ? (
              <span className="text-success">commit ready: &apos;ready for race&apos;</span>
            ) : (
              <span className="text-danger">changes not staged for commit: click [Commit] to ready up</span>
            )}
          </div>
        </div>

        {/* Player 2 (Opponent or GitBot) */}
        <div
          className={`rounded-2xl relative flex flex-col gap-4 border p-5 transition-all ${
            opponent?.committed
              ? 'border-accent/80 bg-accent/5 shadow-md shadow-accent/5'
              : 'border-line bg-surface/60'
          }`}
        >
          {opponent ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={opponent.username} src={opponent.avatarUrl} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink">{opponent.username}</span>
                      {opponent.isBot ? (
                        <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-2xs font-medium text-accent">
                          BOT
                        </span>
                      ) : (
                        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-2xs text-muted">
                          RIVAL
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted">
                      {opponent.isBot ? `Speed: ${botWpm} WPM` : 'Connected'}
                    </div>
                  </div>
                </div>

                {/* Opponent Commit Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium ${
                    opponent.committed ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
                  }`}
                >
                  {opponent.committed ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>COMMITTED</span>
                    </>
                  ) : (
                    <>
                      <GitCommit size={13} />
                      <span>WAITING</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-line/60 bg-canvas/60 p-3 font-mono text-xs text-muted">
                <span className="text-accent">$</span> git branch --track rival
                <br />
                {opponent.committed ? (
                  <span className="text-success">remote commit received: opponent is locked and ready</span>
                ) : (
                  <span className="text-muted">waiting for {opponent.username} to commit...</span>
                )}
              </div>
            </>
          ) : (
            /* Waiting for Opponent */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-line-strong text-muted">
                <Users size={22} className="animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-ink">Waiting for player 2...</div>
                <div className="text-xs text-muted">Share the room code or invite link to race together</div>
              </div>

              {/* Practice vs GitBot option */}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBot(true, 70)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-raised/80 px-3 text-xs font-medium text-ink transition-ui hover:border-line-hover hover:bg-raised"
                >
                  <Bot size={14} className="text-accent" />
                  <span>Practice vs GitBot</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GitBot Settings if active */}
      {botActive && (
        <div className="flex w-full items-center justify-between rounded-xl border border-line bg-surface/50 px-4 py-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Bot size={14} className="text-accent" />
            <span>GitBot Speed:</span>
            {[45, 65, 85, 110].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => onSetBotWpm(speed)}
                className={`rounded px-2 py-0.5 transition-ui ${
                  botWpm === speed
                    ? 'bg-accent font-bold text-accent-ink'
                    : 'border border-line text-muted hover:text-ink'
                }`}
              >
                {speed} WPM
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onToggleBot(false)}
            className="text-muted underline hover:text-danger"
          >
            Remove Bot
          </button>
        </div>
      )}

      {/* Main Commit Action Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onToggleCommit}
          className={`inline-flex h-12 items-center justify-center gap-2.5 rounded-xl px-8 text-base font-bold shadow-lg transition-all select-none active:scale-[0.98] ${
            localPlayer.committed
              ? 'border border-line-strong bg-raised text-ink hover:border-line-hover'
              : 'bg-accent-fill text-accent-ink shadow-accent/20 hover:bg-accent-fill-hover hover:shadow-accent/30'
          }`}
        >
          <GitCommit size={20} />
          <span>{localPlayer.committed ? 'Uncommit (Not Ready)' : 'git commit -m "Ready"'}</span>
        </button>

        <p className="font-mono text-xs text-muted">
          {bothCommitted
            ? 'Both players committed! Starting countdown...'
            : localPlayer.committed
              ? 'Committed! Waiting for opponent to commit...'
              : 'Click Commit to lock in your spot and start the countdown.'}
        </p>
      </div>
    </div>
  );
}
