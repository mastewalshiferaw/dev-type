'use client';

import { useEffect, useRef } from 'react';
import { isModPressed } from '@/hooks/usePlatform';

export interface Hotkey {
  /** `KeyboardEvent.code`, e.g. "KeyK" (layout independent) */
  code: string;
  mod?: boolean;
  shift?: boolean;
  handler: () => void;
}

/** Global shortcuts. Handlers may change every render; listeners are attached once. */
export function useHotkeys(hotkeys: Hotkey[]) {
  const ref = useRef(hotkeys);
  useEffect(() => {
    ref.current = hotkeys;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const match = ref.current.find(
        (hotkey) =>
          hotkey.code === event.code &&
          !!hotkey.mod === isModPressed(event) &&
          !!hotkey.shift === event.shiftKey &&
          !event.altKey
      );
      if (!match) return;
      event.preventDefault();
      match.handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
