'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Handlers {
  /** Put the element in its "before" state. Only called for elements below the fold. */
  hide: (el: HTMLElement) => void;
  /** Play the entrance, once. */
  enter: (el: HTMLElement) => void;
  /** Undo `hide` (unmount, or reduced motion switched on mid-way). */
  reset?: (el: HTMLElement) => void;
}

/**
 * The contract every scroll entrance on the page follows:
 *
 * - The server renders the finished state, so crawlers, no-JS visitors and the first paint all
 *   get real content and nothing shifts.
 * - After mount, only elements still below the fold are hidden (nobody sees that happen), then
 *   enter once when they scroll in. Scrolling back up never replays them.
 * - With reduced motion nothing is hidden and nothing moves.
 */
export function useEnterOnce(
  ref: RefObject<HTMLElement | null>,
  handlers: Handlers,
  margin = '0px 0px -12% 0px'
) {
  const reduce = useReducedMotion();
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || el.getBoundingClientRect().top < window.innerHeight) return;
    const { hide, enter, reset } = handlersRef.current;
    hide(el);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        enter(el);
      },
      { rootMargin: margin }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      reset?.(el);
    };
  }, [ref, reduce, margin]);
}
