'use client';

import { useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent } from 'react';

const noopSubscribe = () => () => {};

const isApple = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** "⌘" on Apple devices, "Ctrl" elsewhere (and during SSR). */
export function useModKey(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => (isApple() ? '⌘' : 'Ctrl'),
    () => 'Ctrl'
  );
}

/** Cmd on Apple devices, Ctrl elsewhere. */
export function isModPressed(event: KeyboardEvent | ReactKeyboardEvent): boolean {
  return isApple() ? event.metaKey : event.ctrlKey;
}
