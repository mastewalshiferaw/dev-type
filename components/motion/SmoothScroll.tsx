'use client';

import type Lenis from '@studio-freight/lenis';
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER, isSplashActive, NAV_OFFSET, SPLASH_END_EVENT } from '@/lib/motion';

type ScrollToTarget = HTMLElement | number;

const ScrollContext = createContext<(target: ScrollToTarget) => void>(() => {});

/** Smoothly scroll to an element (under the sticky nav) or a position, with or without Lenis. */
export const useScrollTo = () => useContext(ScrollContext);

/**
 * Inertial wheel scrolling with Lenis (lerp 0.1), loaded after hydration so it never delays the
 * first paint. Only for mouse and trackpad users without reduced motion: touch keeps native
 * momentum, and keyboard scrolling, find-in-page and focus jumps always stay native.
 *
 * Same-page anchor links are handled here for everyone: smooth scroll with the nav offset, the
 * URL hash updated, and focus moved to the target so keyboard and screen-reader users land there.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reduce || !window.matchMedia(FINE_POINTER).matches) return;
    let cancelled = false;
    let frame = 0;
    const onSplashEnd = () => lenisRef.current?.start();

    import('@studio-freight/lenis').then(({ default: LenisClass }) => {
      if (cancelled) return;
      const lenis = new LenisClass({ lerp: 0.1, smoothWheel: true });
      lenisRef.current = lenis;
      document.documentElement.classList.add('lenis-on');
      if (isSplashActive()) lenis.stop();
      const raf = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });
    window.addEventListener(SPLASH_END_EVENT, onSplashEnd);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener(SPLASH_END_EVENT, onSplashEnd);
      lenisRef.current?.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove('lenis-on');
    };
  }, [reduce]);

  const scrollTo = useCallback(
    (target: ScrollToTarget) => {
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, { offset: typeof target === 'number' ? 0 : -NAV_OFFSET, duration: 1.1 });
        return;
      }
      const top =
        typeof target === 'number'
          ? target
          : target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    },
    [reduce]
  );

  // Same-page hash links (`#id` or `/#id` on the home page). Runs in the capture phase, before
  // next/link, which skips navigation for events that are already default-prevented.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
        return;
      const anchor = (event.target as Element | null)?.closest?.('a[href*="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      history.pushState(null, '', url.hash);
      // Wait two frames so a closing menu can release its scroll lock first
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          scrollTo(target);
          // Focus without a jump, so the next Tab continues from the section
          const focusable = target.matches('a, button, input, textarea, [tabindex]') ? target : null;
          if (!focusable) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        })
      );
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [scrollTo]);

  return <ScrollContext.Provider value={scrollTo}>{children}</ScrollContext.Provider>;
}
