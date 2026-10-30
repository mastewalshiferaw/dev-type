'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeStats,
  createEngineState,
  engineReducer,
  type EngineAction,
  type EngineState,
} from '@/lib/engine';
import type { Settings } from '@/lib/settings';
import { buildRunText, nextChunk, STREAM_LOOKAHEAD, type RunText } from '@/lib/snippets';

const TICK_MS = 200;

export interface RunInfo extends RunText {
  /** Text at the start of the run, so "Try again" can replay it */
  initialText: string;
  /** Changes with every new run; useful as a React key */
  id: number;
}

/**
 * Owns one typing run: the engine state, the clock, streaming more text, and finishing.
 * `onFinish` is called exactly once per run with the final engine state.
 */
export function useTypingRun(settings: Settings, onFinish: (state: EngineState, run: RunInfo) => void) {
  const [state, setState] = useState<EngineState>(createEngineState);
  const [run, setRun] = useState<RunInfo | null>(null);
  const [now, setNow] = useState(0);

  // Latest values for event handlers and timers. Written only outside render.
  const stateRef = useRef(state);
  const runRef = useRef(run);
  const settingsRef = useRef(settings);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    settingsRef.current = settings;
    onFinishRef.current = onFinish;
  });

  const commit = useCallback((next: EngineState) => {
    const previous = stateRef.current;
    stateRef.current = next;
    setState(next);
    if (next.status === 'finished' && previous.status !== 'finished' && runRef.current) {
      onFinishRef.current(next, runRef.current);
    }
  }, []);

  const dispatch = useCallback(
    (action: EngineAction) => {
      let next = engineReducer(stateRef.current, action);
      const current = runRef.current;
      // Keep streaming runs topped up so the text never runs out under the cursor
      if (current?.streaming && next.status !== 'finished') {
        while (next.text.length - next.input.length < STREAM_LOOKAHEAD) {
          next = engineReducer(next, { type: 'append', text: nextChunk(settingsRef.current, next.text) });
        }
      }
      commit(next);
    },
    [commit]
  );

  const startRun = useCallback(
    (text: RunText) => {
      const info: RunInfo = { ...text, initialText: text.text, id: (runRef.current?.id ?? 0) + 1 };
      runRef.current = info;
      setRun(info);
      setNow(0);
      commit(createEngineState(text.text, settingsRef.current.autoIndent));
    },
    [commit]
  );

  /** A fresh snippet with the current settings. */
  const next = useCallback(() => {
    startRun(buildRunText(settingsRef.current, runRef.current?.initialText));
  }, [startRun]);

  /** The same text again. */
  const retry = useCallback(() => {
    const current = runRef.current;
    if (!current) return next();
    startRun({ text: current.initialText, language: current.language, streaming: current.streaming });
  }, [next, startRun]);

  // New text whenever a setting that shapes the text changes (and on mount).
  // Snippets are picked at random, which must happen on the client after hydration.
  const textKey = [
    settings.language,
    settings.mode,
    settings.duration,
    settings.lineCount,
    settings.length,
    settings.punctuation,
    settings.indentation,
    settings.skipComments,
    settings.autoIndent,
    settings.customText,
  ].join('|');
  useEffect(() => {
    next();
  }, [textKey, next]);

  // Clock: drives samples, the countdown and the time-mode finish
  const { status, startedAt } = state;
  useEffect(() => {
    if (status !== 'running' || startedAt === null) return;
    const tick = () => {
      const time = Date.now();
      const { mode, duration } = settingsRef.current;
      const limit = startedAt + duration * 1000;
      if (mode === 'time' && time >= limit) dispatch({ type: 'finish', now: limit });
      else dispatch({ type: 'tick', now: time });
      setNow(time);
    };
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [status, startedAt, dispatch]);

  const finish = useCallback(() => dispatch({ type: 'finish', now: Date.now() }), [dispatch]);

  const elapsedMs = state.startedAt === null ? 0 : Math.max(0, (state.endedAt ?? now) - state.startedAt);
  const liveWpm = state.status === 'running' && elapsedMs > 1000 ? computeStats(state, now).wpm : null;

  return { state, run, dispatch, next, retry, finish, elapsedMs, liveWpm };
}
