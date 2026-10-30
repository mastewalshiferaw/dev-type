'use client';

import { MotionConfig } from 'motion/react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import LandingNav from '@/components/landing/nav/LandingNav';
import ScrollProgress from '@/components/motion/ScrollProgress';
import SmoothScroll from '@/components/motion/SmoothScroll';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER } from '@/lib/motion';
import { toggleTheme } from '@/lib/theme';

// Downloaded the first time the palette opens
const LandingPalette = dynamic(() => import('@/components/landing/nav/LandingPalette'));
// Extras that nothing on screen depends on: fetched once the browser is idle
const CustomCursor = dynamic(() => import('@/components/motion/CustomCursor'), { ssr: false });
const SudoConfetti = dynamic(() => import('@/components/motion/SudoConfetti'), { ssr: false });

/** True once the main thread has had a quiet moment after hydration. */
function useIdle() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const ready = () => setIdle(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(ready, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(ready, 1500);
    return () => clearTimeout(id);
  }, []);
  return idle;
}

const subscribePointer = (onChange: () => void) => {
  const media = window.matchMedia(FINE_POINTER);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

/**
 * Client chrome around the landing sections: skip link, smooth scrolling, the scroll-progress bar,
 * navbar, palette and shortcuts, plus the optional extras (custom cursor, grain, Easter egg).
 */
export default function LandingShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const idle = useIdle();
  const reduce = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribePointer,
    () => window.matchMedia(FINE_POINTER).matches,
    () => false
  );

  const togglePalette = (open?: boolean) => {
    setPaletteLoaded(true);
    setPaletteOpen((current) => open ?? !current);
  };

  useHotkeys([
    { code: 'KeyK', mod: true, handler: () => togglePalette() },
    { code: 'KeyL', mod: true, shift: true, handler: () => toggleTheme() },
  ]);

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <a
          href="#main"
          className="sr-only z-[90] rounded-md bg-accent-fill px-3 py-2 text-sm font-bold text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <ScrollProgress />
        <LandingNav onOpenPalette={() => togglePalette(true)} />
        {children}
        {paletteLoaded && <LandingPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}

        {/* Dark-theme film grain (CSS decides when it shows) */}
        <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[55]" />
        {idle && <SudoConfetti />}
        {idle && finePointer && !reduce && <CustomCursor />}
      </SmoothScroll>
    </MotionConfig>
  );
}
