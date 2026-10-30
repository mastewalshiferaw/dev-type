'use client';

import { useCallback, useRef, type FormEvent, type KeyboardEvent, type RefObject } from 'react';
import { canIndent, type EngineAction, type EngineState } from '@/lib/engine';

/** The hidden textarea always holds this, so mobile Backspace has something to delete */
const SENTINEL = ' ';

interface Options {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  state: EngineState;
  dispatch: (action: EngineAction) => void;
  /** Tab where no indentation is expected */
  onRestart: () => void;
  /** Shift+Enter while running; omit to treat it as a plain Enter */
  onFinish?: () => void;
}

/**
 * Drives the typing engine from a visually hidden textarea, which works with hardware keyboards,
 * mobile keyboards and IMEs alike. Spread `inputProps` onto the textarea.
 */
export function useHiddenInput({ inputRef, state, dispatch, onRestart, onFinish }: Options) {
  const lastValue = useRef(SENTINEL);
  const composing = useRef(false);

  const resetField = useCallback(() => {
    const el = inputRef.current;
    if (el) {
      el.value = SENTINEL;
      // Caret after the sentinel, so Backspace on a mobile keyboard always has it to delete
      el.setSelectionRange(SENTINEL.length, SENTINEL.length);
    }
    lastValue.current = SENTINEL;
  }, [inputRef]);

  const typeText = (text: string) => {
    const now = Date.now();
    for (const ch of text) {
      if (ch === '\n' || ch === '\r') dispatch({ type: 'enter', now });
      else if (ch === '\t') dispatch({ type: 'indent', now });
      else dispatch({ type: 'type', char: ch, now });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    const now = Date.now();

    if (event.key === 'Tab') {
      if (event.shiftKey) return; // Shift+Tab leaves the typing area
      event.preventDefault();
      if (canIndent(state)) dispatch({ type: 'indent', now });
      else onRestart();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.shiftKey && onFinish && state.status === 'running') onFinish();
      else dispatch({ type: 'enter', now });
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'backspace', word: event.ctrlKey || event.altKey || event.metaKey });
    }
  };

  /**
   * Characters arrive here rather than through keydown, because mobile keyboards and IMEs
   * report most keys as "Unidentified". The field is diffed against its previous value.
   */
  const onInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const value = event.currentTarget.value;
    const previous = lastValue.current;
    // Diff on both ends: the caret may sit before the sentinel, so text can land on either side
    let prefix = 0;
    while (prefix < value.length && prefix < previous.length && value[prefix] === previous[prefix]) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < value.length - prefix &&
      suffix < previous.length - prefix &&
      value[value.length - 1 - suffix] === previous[previous.length - 1 - suffix]
    ) {
      suffix++;
    }
    const deleted = previous.length - prefix - suffix;
    for (let i = 0; i < deleted; i++) dispatch({ type: 'backspace', word: false });
    typeText(value.slice(prefix, value.length - suffix));

    if (composing.current) lastValue.current = value;
    else resetField();
  };

  return {
    resetField,
    inputProps: {
      ref: inputRef,
      defaultValue: SENTINEL,
      autoCapitalize: 'off',
      autoComplete: 'off',
      autoCorrect: 'off',
      spellCheck: false,
      inputMode: 'text' as const,
      enterKeyHint: 'enter' as const,
      onKeyDown,
      onInput,
      onPaste: (event: { preventDefault: () => void }) => event.preventDefault(),
      onDrop: (event: { preventDefault: () => void }) => event.preventDefault(),
      onCompositionStart: () => {
        composing.current = true;
      },
      onCompositionEnd: () => {
        composing.current = false;
        resetField();
      },
    },
  };
}
