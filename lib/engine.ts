/**
 * Pure typing engine: a reducer over the run state plus stat helpers.
 * Timestamps come in through actions so the reducer stays pure and testable.
 */

export type RunStatus = 'idle' | 'running' | 'finished';
export type CharState = 'correct' | 'incorrect' | 'current' | 'untyped';

export interface Sample {
  /** Seconds since start (the last sample may be fractional) */
  second: number;
  /** Net WPM up to this point */
  wpm: number;
  /** Raw WPM within this second */
  raw: number;
  /** Mistakes within this second */
  errors: number;
}

export interface EngineState {
  status: RunStatus;
  text: string;
  /** What was typed at each position; its length is the cursor */
  input: string;
  /** '1' where the character was filled in by auto-indent, '0' where it was typed */
  autoMask: string;
  autoIndent: boolean;
  correctKeys: number;
  incorrectKeys: number;
  startedAt: number | null;
  endedAt: number | null;
  samples: Sample[];
  /** Keystrokes since the last sample */
  bucket: { chars: number; errors: number };
}

export type EngineAction =
  | { type: 'reset'; text: string; autoIndent: boolean }
  | { type: 'append'; text: string }
  | { type: 'type'; char: string; now: number }
  | { type: 'enter'; now: number }
  | { type: 'indent'; now: number }
  | { type: 'backspace'; word: boolean }
  | { type: 'tick'; now: number }
  | { type: 'finish'; now: number };

export function createEngineState(text = '', autoIndent = true): EngineState {
  return {
    status: 'idle',
    text,
    input: '',
    autoMask: '',
    autoIndent,
    correctKeys: 0,
    incorrectKeys: 0,
    startedAt: null,
    endedAt: null,
    samples: [],
    bucket: { chars: 0, errors: 0 },
  };
}

const isIndent = (ch: string | undefined) => ch === ' ' || ch === '\t';

function start(state: EngineState, now: number): EngineState {
  return state.status === 'idle' ? { ...state, status: 'running', startedAt: now } : state;
}

function miss(state: EngineState): EngineState {
  return {
    ...state,
    incorrectKeys: state.incorrectKeys + 1,
    bucket: { ...state.bucket, errors: state.bucket.errors + 1 },
  };
}

/** Append typed characters; `auto` ones are not counted as keystrokes. */
function advance(state: EngineState, typed: string, now: number, auto = ''): EngineState {
  const offset = state.input.length;
  let correct = 0;
  let incorrect = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === state.text[offset + i]) correct++;
    else incorrect++;
  }
  const next: EngineState = {
    ...state,
    input: state.input + typed + auto,
    autoMask: state.autoMask + '0'.repeat(typed.length) + '1'.repeat(auto.length),
    correctKeys: state.correctKeys + correct,
    incorrectKeys: state.incorrectKeys + incorrect,
    bucket: {
      chars: state.bucket.chars + typed.length,
      errors: state.bucket.errors + incorrect,
    },
  };
  return next.input.length >= next.text.length ? finish(next, now) : next;
}

/** Whitespace that follows the cursor on the current line's indentation. */
function leadingWhitespaceAt(text: string, from: number): string {
  let end = from;
  while (isIndent(text[end])) end++;
  return text.slice(from, end);
}

/** True when Tab should type indentation instead of restarting. */
export function canIndent(state: EngineState): boolean {
  if (state.status === 'finished') return false;
  const cursor = state.input.length;
  const expected = state.text[cursor];
  if (expected === '\t') return true;
  if (expected !== ' ') return false;
  const lineStart = state.text.lastIndexOf('\n', cursor - 1) + 1;
  return /^[ \t]*$/.test(state.text.slice(lineStart, cursor));
}

function sampleUpTo(state: EngineState, now: number): EngineState {
  if (state.startedAt === null) return state;
  const elapsedSeconds = Math.floor((now - state.startedAt) / 1000);
  if (elapsedSeconds <= state.samples.length) return state;

  const samples = [...state.samples];
  let bucket = state.bucket;
  const net = correctChars(state);
  while (samples.length < elapsedSeconds) {
    const second = samples.length + 1;
    samples.push({
      second,
      wpm: Math.round(net / 5 / (second / 60)),
      raw: bucket.chars * 12,
      errors: bucket.errors,
    });
    bucket = { chars: 0, errors: 0 };
  }
  return { ...state, samples, bucket };
}

function finish(state: EngineState, now: number): EngineState {
  if (state.status === 'finished') return state;
  const startedAt = state.startedAt ?? now;
  const sampled = sampleUpTo({ ...state, startedAt }, now);
  const elapsed = (now - startedAt) / 1000;
  const partial = elapsed - sampled.samples.length;
  const samples = [...sampled.samples];
  // Keep a trailing partial second only when it is long enough to mean something
  if (partial >= 0.25 && elapsed > 0) {
    samples.push({
      second: Math.round(elapsed * 100) / 100,
      wpm: Math.round(correctChars(sampled) / 5 / (elapsed / 60)),
      raw: Math.round((sampled.bucket.chars / partial) * 12),
      errors: sampled.bucket.errors,
    });
  }
  return {
    ...sampled,
    samples,
    status: 'finished',
    startedAt,
    endedAt: now,
    bucket: { chars: 0, errors: 0 },
  };
}

export function engineReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case 'reset':
      return createEngineState(action.text, action.autoIndent);

    case 'append':
      return state.status === 'finished' ? state : { ...state, text: state.text + action.text };

    case 'type': {
      if (state.status === 'finished' || state.input.length >= state.text.length) return state;
      const started = start(state, action.now);
      // A character where a line break belongs is a miss, but the cursor waits for Enter
      if (state.text[state.input.length] === '\n') return miss(started);
      return advance(started, action.char, action.now);
    }

    case 'enter': {
      if (state.status === 'finished') return state;
      const started = start(state, action.now);
      const cursor = state.input.length;
      if (state.text[cursor] !== '\n') return miss(started);
      const auto = state.autoIndent ? leadingWhitespaceAt(state.text, cursor + 1) : '';
      return advance(started, '\n', action.now, auto);
    }

    case 'indent': {
      if (!canIndent(state)) return state;
      const started = start(state, action.now);
      const cursor = state.input.length;
      if (state.text[cursor] === '\t') return advance(started, '\t', action.now);
      // Spaces up to the next 4-column stop, or until the indentation ends
      const lineStart = state.text.lastIndexOf('\n', cursor - 1) + 1;
      const column = cursor - lineStart;
      const width = Math.min(4 - (column % 4), leadingWhitespaceAt(state.text, cursor).length);
      return advance(started, ' '.repeat(Math.max(1, width)), action.now);
    }

    case 'backspace': {
      if (state.status === 'finished' || state.input.length === 0) return state;
      const { input, autoMask } = state;
      let n = input.length;
      // Auto-indentation goes away together with the line break that produced it
      while (n > 0 && autoMask[n - 1] === '1') n--;
      if (action.word && input[n - 1] !== '\n') {
        while (n > 0 && isIndent(input[n - 1])) n--;
        while (n > 0 && !/\s/.test(input[n - 1])) n--;
      } else {
        n = Math.max(0, n - 1);
      }
      return { ...state, input: input.slice(0, n), autoMask: autoMask.slice(0, n) };
    }

    case 'tick':
      return state.status === 'running' ? sampleUpTo(state, action.now) : state;

    case 'finish':
      return state.status === 'running' ? finish(state, action.now) : state;
  }
}

/** Correctly typed characters, not counting auto-indentation. */
export function correctChars(state: Pick<EngineState, 'input' | 'text' | 'autoMask'>): number {
  let count = 0;
  for (let i = 0; i < state.input.length; i++) {
    if (state.autoMask[i] === '0' && state.input[i] === state.text[i]) count++;
  }
  return count;
}

export function charState(state: Pick<EngineState, 'input' | 'text'>, index: number): CharState {
  if (index === state.input.length) return 'current';
  if (index > state.input.length) return 'untyped';
  return state.input[index] === state.text[index] ? 'correct' : 'incorrect';
}

export interface RunStats {
  wpm: number;
  raw: number;
  accuracy: number;
  /** null when the run was too short to measure */
  consistency: number | null;
  errors: number;
  correctChars: number;
  incorrectChars: number;
  durationMs: number;
}

/** Consistency: 100 means every second had the same raw speed. */
export function consistencyOf(samples: readonly Sample[]): number | null {
  const values = samples.map((s) => s.raw);
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.round(100 * (1 - Math.tanh(cv)));
}

export function computeStats(state: EngineState, now: number): RunStats {
  const end = state.endedAt ?? now;
  const durationMs = state.startedAt === null ? 0 : Math.max(0, end - state.startedAt);
  const minutes = durationMs / 60000;
  const net = correctChars(state);
  let incorrect = 0;
  for (let i = 0; i < state.input.length; i++) {
    if (state.input[i] !== state.text[i]) incorrect++;
  }
  const keys = state.correctKeys + state.incorrectKeys;
  return {
    wpm: minutes > 0 ? Math.round(net / 5 / minutes) : 0,
    raw: minutes > 0 ? Math.round(keys / 5 / minutes) : 0,
    accuracy: keys > 0 ? Math.round((state.correctKeys / keys) * 1000) / 10 : 100,
    consistency: consistencyOf(state.samples),
    errors: state.incorrectKeys,
    correctChars: net,
    incorrectChars: incorrect,
    durationMs,
  };
}
