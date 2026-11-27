'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Swords, Timer as TimerIcon } from 'lucide-react';
import CodeView from '@/components/typing/CodeView';
import Avatar from '@/components/leaderboard/Avatar';
import { useHiddenInput } from '@/hooks/useHiddenInput';
import {
  computeStats,
  createEngineState,
  engineReducer,
  type EngineAction,
  type EngineState,
} from '@/lib/engine';
import { useSettings } from '@/lib/settings';
import type { DuelPlayer, DuelPlayerStats } from '@/lib/duel/types';

interface DuelArenaProps {
  snippet: string;
  localPlayer: DuelPlayer;
  opponent?: DuelPlayer | null;
  onReportProgress: (cursor: number, progress: number, wpm: number, errors: number) => void;
  onReportFinish: (stats: DuelPlayerStats) => void;
}

export default function DuelArena({
  snippet,
  localPlayer,
  opponent,
  onReportProgress,
  onReportFinish,
}: DuelArenaProps) {
  const settings = useSettings();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [engineState, setEngineState] = useState<EngineState>(() =>
    createEngineState(snippet, settings.autoIndent)
  );
  const [focused, setFocused] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (engineState.status !== 'running') return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [engineState.status]);

  // Initialize engine state whenever snippet changes
  useEffect(() => {
    setEngineState(createEngineState(snippet, settings.autoIndent));
  }, [snippet, settings.autoIndent]);

  // Keep focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const dispatch = useCallback(
    (action: EngineAction) => {
      setEngineState((prev) => {
        if (prev.status === 'finished') return prev;

        const next = engineReducer(prev, action);
        const now = Date.now();
        const stats = computeStats(next, now);

        const progress = next.text.length > 0 ? next.input.length / next.text.length : 0;
        const liveWpm = stats.wpm;
        const errors = next.incorrectKeys;

        onReportProgress(next.input.length, progress, liveWpm, errors);

        if (next.status === 'finished') {
          onReportFinish({
            wpm: stats.wpm,
            raw: stats.raw,
            accuracy: stats.accuracy,
            durationMs: stats.durationMs,
          });
        }

        return next;
      });
    },
    [onReportProgress, onReportFinish]
  );

  const { resetField, inputProps } = useHiddenInput({
    inputRef,
    state: engineState,
    dispatch,
    onRestart: () => {},
  });

  useEffect(() => {
    resetField();
  }, [snippet, resetField]);

  // Calculate live lead delta
  const localCursor = engineState.input.length;
  const opponentCursor = opponent?.cursor ?? 0;
  const deltaChars = localCursor - opponentCursor;

  const localProgress = snippet.length > 0 ? (localCursor / snippet.length) * 100 : 0;
  const opponentProgress = snippet.length > 0 ? (opponentCursor / snippet.length) * 100 : 0;

  const elapsedSeconds = engineState.startedAt
    ? Math.floor(((engineState.endedAt ?? (now || engineState.startedAt)) - engineState.startedAt) / 1000)
    : 0;

  const lineCount = snippet.split('\n').length;
  const rows = Math.min(9, Math.max(4, lineCount));

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Head-to-Head HUD Racing Tracks */}
      <div className="rounded-2xl flex flex-col gap-3 border border-line bg-surface/75 p-5 shadow-sm">
        {/* Match Header */}
        <div className="flex items-center justify-between font-mono text-xs text-muted">
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-accent" />
            <span className="font-semibold text-ink">LIVE COMMIT RACE</span>
          </div>

          {/* Lead Indicator */}
          <div className="rounded-full border border-line bg-canvas/70 px-3 py-0.5">
            {deltaChars > 0 ? (
              <span className="font-bold text-success">+{deltaChars} chars ahead</span>
            ) : deltaChars < 0 ? (
              <span className="font-bold text-danger">{Math.abs(deltaChars)} chars behind</span>
            ) : (
              <span className="text-muted">Neck and neck</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <TimerIcon size={14} />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>

        {/* Track 1: You */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Avatar name={localPlayer.username} src={localPlayer.avatarUrl} size="sm" />
              <span className="font-bold text-ink">{localPlayer.username} (You)</span>
              {engineState.status === 'finished' && (
                <span className="rounded py-0.2 bg-success/15 px-1.5 font-mono text-2xs font-bold text-success">
                  FINISHED
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-muted">
                {localPlayer.wpm} <span className="text-2xs">WPM</span>
              </span>
              <span className="font-bold text-ink">{Math.round(localProgress)}%</span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-accent transition-all duration-100 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, localProgress))}%` }}
            />
          </div>
        </div>

        {/* Track 2: Opponent */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Avatar name={opponent?.username ?? 'Opponent'} src={opponent?.avatarUrl} size="sm" />
              <span className="font-bold text-ink">{opponent?.username ?? 'Waiting for opponent'}</span>
              {opponent?.finished && (
                <span className="rounded py-0.2 bg-success/15 px-1.5 font-mono text-2xs font-bold text-success">
                  FINISHED
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-muted">
                {opponent?.wpm ?? 0} <span className="text-2xs">WPM</span>
              </span>
              <span className="font-bold text-ink">{Math.round(opponentProgress)}%</span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-line-strong transition-all duration-150 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, opponentProgress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Code Arena with hidden input and CodeView */}
      <div className="rounded-2xl relative border border-line bg-surface/40 p-6 shadow-sm">
        {/* Hidden input spread */}
        <textarea
          {...inputProps}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label="Duel code input"
        />

        <CodeView
          text={engineState.text}
          input={engineState.input}
          cursorStyle={settings.cursorStyle}
          font={settings.font}
          fontSize={settings.fontSize}
          ligatures={settings.ligatures}
          rows={rows}
          tone="success"
        />

        {!focused && (
          <div className="rounded-2xl backdrop-blur-2xs absolute inset-0 flex items-center justify-center bg-canvas/40">
            <div className="rounded-lg border border-line bg-surface px-4 py-2 font-mono text-xs text-muted shadow-sm">
              Click anywhere to resume typing
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
