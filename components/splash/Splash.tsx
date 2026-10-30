'use client';

import { Terminal } from 'lucide-react';
import { animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { LANGUAGE_COUNT } from '@/data/landing/languages';
import { DURATION, EASE, EASE_REVEAL, SPLASH_END_EVENT } from '@/lib/motion';

const WORD = 'DEV_TYPE';
const BOOT_LOG = [
  { text: '> loading snippets .........', result: `${LANGUAGE_COUNT} languages` },
  { text: '> warming up keyboard ......', result: 'ok' },
  { text: '> ready.', result: '' },
];

const TYPE_START_MS = 220;
const LOG_GAP_MS = 150;
const HOLD_MS = 240;
const EXIT_MS = 760;
/** The CSS failsafe hides the overlay at 6s; arriving later than this, skip straight to the page */
const TOO_LATE_MS = 5000;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * Terminal-boot intro, first visit per session only (the decision is made by the head script in
 * lib/splash-script.ts, before the first paint). The landing page is fully server-rendered
 * underneath; this is an aria-hidden overlay on top.
 *
 * Sequence (~2.3s): `>_` with a block caret, DEV_TYPE typed with a human rhythm, a three-line boot
 * log, then the wordmark flies into the navbar logo (FLIP) while the overlay wipes upward and the
 * hero plays its entrance behind it. Any key or click skips. Reduced motion: a 400ms fade.
 */
export default function Splash() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const mode = html.getAttribute('data-splash');
    if (!mode) return;

    let cancelled = false;
    let exiting = false;
    const root = rootRef.current!;
    const moveCaret = (chars: number) => {
      caretRef.current!.style.transform = 'translateX(calc(' + chars + ' * (1ch + 0.05em)))';
    };

    const release = () => {
      html.removeAttribute('data-splash');
      window.dispatchEvent(new Event(SPLASH_END_EVENT));
    };
    const finish = () => {
      html.removeAttribute('data-splash');
      html.removeAttribute('data-splash-logo');
      setDone(true);
    };

    // Any key or click: straight to the page. Swallowed, so it does not also type into the demo.
    const skip = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      if (cancelled) return;
      cancelled = true;
      if (!exiting) release();
      finish();
    };
    window.addEventListener('keydown', skip, true);
    window.addEventListener('pointerdown', skip, true);
    const removeSkip = () => {
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('pointerdown', skip, true);
    };

    const run = async () => {
      if (performance.now() > TOO_LATE_MS) {
        cancelled = true;
        release();
        finish();
        return;
      }

      if (mode === 'reduced') {
        typedRef.current!.textContent = WORD;
        moveCaret(WORD.length);
        root.dataset.state = 'exit';
        exiting = true;
        release();
        await animate(root, { opacity: [1, 0] }, { duration: 0.4, ease: 'linear' });
        if (!cancelled) finish();
        return;
      }

      // Typing DEV_TYPE: a fast typist, slightly uneven
      const timeline: number[] = [];
      let t = TYPE_START_MS;
      for (let i = 0; i < WORD.length; i++) {
        t += 45 + Math.random() * 65 + (i === 3 ? 60 : 0); // a beat before the underscore
        timeline.push(t);
      }
      const logStart = t + 120;
      const exitAt = logStart + BOOT_LOG.length * LOG_GAP_MS + HOLD_MS;

      animate(
        progressRef.current!,
        { transform: ['scaleX(0)', 'scaleX(1)'] },
        { duration: exitAt / 1000, ease: EASE }
      );

      let elapsed = 0;
      for (let i = 0; i < WORD.length; i++) {
        await wait(timeline[i] - elapsed);
        elapsed = timeline[i];
        if (cancelled) return;
        typedRef.current!.textContent = WORD.slice(0, i + 1);
        moveCaret(i + 1);
      }
      const lines = [...logRef.current!.children] as HTMLElement[];
      for (let i = 0; i < lines.length; i++) {
        await wait(i === 0 ? logStart - elapsed : LOG_GAP_MS);
        if (cancelled) return;
        lines[i].style.opacity = '1';
      }
      await wait(HOLD_MS);
      if (cancelled) return;

      // Exit: hand the page back (scroll, hero entrance), wipe the overlay up, fly the wordmark home
      exiting = true;
      root.dataset.state = 'exit';
      release();

      const word = wordmarkRef.current!;
      const from = word.getBoundingClientRect();
      const to = document.querySelector('[data-nav-logo]')?.getBoundingClientRect();
      caretRef.current!.style.opacity = '0';
      animate(
        [contentRef.current!, hintRef.current!],
        { opacity: 0 },
        { duration: DURATION.base, ease: EASE }
      );
      animate(
        bgRef.current!,
        { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] },
        { duration: EXIT_MS / 1000, ease: EASE_REVEAL }
      );
      if (to && to.width > 0) {
        const scale = to.width / from.width;
        const x = to.left + to.width / 2 - (from.left + from.width / 2);
        const y = to.top + to.height / 2 - (from.top + from.height / 2);
        await animate(
          word,
          { transform: ['none', `translate(${x}px, ${y}px) scale(${scale})`] },
          { duration: EXIT_MS / 1000, ease: EASE_REVEAL }
        );
      } else {
        await animate(word, { opacity: 0 }, { duration: DURATION.slow, ease: EASE });
      }
      if (!cancelled) finish();
    };

    run();
    return () => {
      cancelled = true;
      removeSkip();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} aria-hidden className="splash fixed inset-0 z-[70] cursor-default select-none">
      <div ref={bgRef} className="absolute inset-0 bg-canvas">
        <div className="absolute inset-0 bg-dots fade-radial" />
        <div
          ref={progressRef}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-accent-fill"
        />
      </div>

      <div className="relative flex h-full flex-col items-center justify-center px-4">
        <div className="flex flex-col items-start gap-8">
          {/* Same proportions as the navbar logo (icon 1.43×, gap 0.57× the text size), so the
              flight into it is a pure translate + scale */}
          <div
            ref={wordmarkRef}
            className="flex origin-center items-center gap-6 text-[2.625rem] leading-none font-bold tracking-wider text-ink-dim will-change-transform sm:gap-8 sm:text-[3.5rem]"
          >
            <Terminal className="size-15 shrink-0 text-accent sm:size-20" strokeWidth={2} />
            <span className="relative whitespace-pre">
              <span className="invisible">{WORD}</span>
              <span ref={typedRef} className="absolute inset-y-0 left-0" />
              {/* Moved with transform as letters appear (one advance = 1ch + the 0.05em tracking), so
                  typing never causes a layout shift */}
              <span
                ref={caretRef}
                className="absolute top-[0.05em] left-[0.1em] h-[0.9em] w-[0.5em] animate-blink bg-accent-fill"
              />
            </span>
          </div>

          <div ref={contentRef} className="w-full">
            <ol ref={logRef} className="flex flex-col gap-1 text-xs text-muted sm:text-sm">
              {BOOT_LOG.map((line) => (
                <li key={line.text} className="opacity-0 transition-opacity duration-(--duration-fast)">
                  {line.text} <span className="text-accent">{line.result}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <p ref={hintRef} className="absolute right-4 bottom-4 text-2xs text-muted sm:right-6 sm:bottom-6">
          <span className="pointer-coarse:hidden">press any key to skip</span>
          <span className="hidden pointer-coarse:inline">tap to skip</span>
        </p>
      </div>
    </div>
  );
}
