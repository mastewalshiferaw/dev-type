'use client';

import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CONTAINER, SectionHeading } from '@/components/landing/Section';
import Kbd from '@/components/ui/Kbd';
import { STEPS } from '@/data/landing/steps';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** A small, concrete hint under each step. */
const STEP_DETAILS: readonly ReactNode[] = [
  <>
    <Kbd>TypeScript</Kbd> <Kbd>time 30</Kbd>
  </>,
  <>
    <Kbd>Enter</Kbd> <Kbd>Tab</Kbd> <Kbd>Backspace</Kbd>
  </>,
  <>
    <Kbd>#1</Kbd> <Kbd>128 wpm</Kbd>
  </>,
];

/** The three steps as code, typed along with the scroll. One block per step. */
const CODE = [
  "// 01 pick\nconst run = devtype('typescript', 'time 30');",
  '// 02 type\nawait run.type(snippet); // Enter, Tab, Backspace',
  "// 03 track\nrun.result(); // { wpm: 128, rank: '#1' }",
].join('\n\n');

/** Mirrors the `pin` variant in app/globals.css */
const PIN_QUERY = '(min-width: 64rem) and (min-height: 45rem) and (prefers-reduced-motion: no-preference)';
const subscribePin = (onChange: () => void) => {
  const media = window.matchMedia(PIN_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};
const usePinned = () =>
  useSyncExternalStore(
    subscribePin,
    () => window.matchMedia(PIN_QUERY).matches,
    () => false
  );

/**
 * A pinned scroll scene on large screens: the section holds still while scrolling drives it.
 * Steps light up one by one, the line draws between them, and the code on the right types itself
 * in sync (scrubbed: scroll back and it un-types). On phones, short screens and with reduced
 * motion it is an ordinary section; the same progress then follows the section through the
 * viewport, or everything is simply shown finished.
 */
export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const pinned = usePinned();

  // Pinned: progress across the 260vh track. Stacked: as the section passes the middle of the screen.
  const pinnedScroll = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const stackedScroll = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] });
  const raw = pinned ? pinnedScroll.scrollYProgress : stackedScroll.scrollYProgress;
  const progress = useSpring(raw, { stiffness: 200, damping: 34, restDelta: 0.001 });
  const line = useTransform(progress, [0.05, 0.75], [0, 1]);

  const [value, setValue] = useState(0);
  useMotionValueEvent(progress, 'change', (latest) => setValue(Math.round(latest * 200) / 200));
  const p = reduce ? 1 : value;

  const lit = (i: number) => p >= 0.05 + i * 0.33;
  const typed = Math.round(Math.min(1, p / 0.85) * CODE.length);

  return (
    <section
      ref={ref}
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="relative scroll-mt-16 pin:h-[260vh]"
    >
      <div className="pin:sticky pin:top-0 pin:flex pin:h-dvh pin:items-center">
        <div className={`${CONTAINER} w-full section-y pin:py-0`}>
          <SectionHeading id="how-it-works" eyebrow="how it works" title="Three steps, zero onboarding">
            No account, no tutorial, no settings to fight. Open it and type.
          </SectionHeading>

          <div className="mx-auto mt-12 grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ol className="relative flex flex-col gap-10">
              {/* The connector runs through the markers' centres (markers are 2.5rem wide) */}
              <div aria-hidden className="absolute top-5 bottom-5 left-5 w-px bg-line">
                <motion.div
                  className="size-full origin-top bg-accent-fill"
                  style={{ scaleY: reduce ? 1 : line }}
                />
              </div>
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative flex gap-6">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-panel transition-ui duration-(--duration-slow) ${
                      lit(i)
                        ? 'scale-100 border-accent-fill bg-accent-fill text-accent-ink'
                        : 'scale-90 border-line-strong bg-surface text-muted'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div
                    // Upcoming steps sit back with color and a nudge, never opacity: their text keeps AA contrast
                    className={`flex flex-col gap-2 transition-transform duration-(--duration-slow) ease-out ${
                      lit(i) ? '' : 'translate-x-1'
                    }`}
                  >
                    <h3
                      className={`text-base font-bold transition-ui duration-(--duration-slow) ${lit(i) ? 'text-ink' : 'text-muted'}`}
                    >
                      {step.title}
                    </h3>
                    <p className="max-w-sm font-sans text-sm text-muted">{step.description}</p>
                    <p aria-hidden className="mt-1 flex flex-wrap gap-1">
                      {STEP_DETAILS[i]}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            {/* The same three steps, as code typing itself */}
            <figure className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift">
              <figcaption className="flex h-10 items-center gap-2 border-b border-line bg-raised/50 px-4 text-xs text-muted">
                <span aria-hidden className="flex gap-2">
                  <span className="size-3 rounded-full bg-line-strong" />
                  <span className="size-3 rounded-full bg-line-strong" />
                  <span className="size-3 rounded-full bg-line-strong" />
                </span>
                <span className="ml-2">quickstart.ts</span>
              </figcaption>
              <pre className="min-h-[12.5rem] p-6 text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
                <code>
                  <span className="sr-only">{CODE}</span>
                  <span aria-hidden>
                    <span className="text-ink">{CODE.slice(0, typed)}</span>
                    <span className="inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-blink bg-caret" />
                    <span className="text-muted">{CODE.slice(typed)}</span>
                  </span>
                </code>
              </pre>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
