'use client';

import { ArrowRight, BadgeCheck, Code2, Timer, Trophy } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, type CSSProperties, type PointerEvent } from 'react';
import HeroDemo from '@/components/landing/hero/HeroDemo';
import { ButtonLink } from '@/components/ui/Button';
import { LANGUAGE_COUNT } from '@/data/landing/languages';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { STAGGER } from '@/lib/motion';

const TRUST_STATS = [
  { icon: Code2, label: `${LANGUAGE_COUNT} languages` },
  { icon: Timer, label: '15s to 120s tests' },
  { icon: BadgeCheck, label: 'Free, no signup' },
];

/** Entrance order: badge, the three headline words, subhead, CTAs, trust row, then the demo. */
const delayOf = (index: number) => index * STAGGER * 1.5;
const step = (index: number): CSSProperties => ({ animationDelay: `${delayOf(index)}s` });

const HEADLINE = [
  { text: 'Type', accent: false },
  { text: 'code,', accent: false },
  { text: 'not prose.', accent: true },
];

/**
 * The hero. Its entrance is pure CSS (`hero-sequence`), so it plays from the first frame on repeat
 * visits and waits, paused, behind the boot splash on the first one (see app/globals.css).
 * On scroll the headline eases back while the demo rises faster (parallax depth); a soft amber
 * light follows the cursor across the dot grid.
 */
export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const headScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.92]);
  const headOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.25]);
  const headY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const demoY = useTransform(scrollYProgress, [0, 1], [0, -90]);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--glow-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--glow-y', `${event.clientY - rect.top}px`);
  };

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      onPointerMove={onPointerMove}
      className="hero-sequence relative isolate overflow-x-clip"
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots fade-radial" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 cursor-glow" />

      <motion.div
        style={reduce ? undefined : { scale: headScale, opacity: headOpacity, y: headY }}
        className="page-container flex origin-top flex-col items-center pt-[clamp(2rem,7vh,6rem)] text-center"
      >
        <p
          style={step(0)}
          className="inline-flex animate-enter items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-1 text-xs text-ink-dim shadow-panel"
        >
          <span aria-hidden className="font-bold text-accent">
            &gt;_
          </span>
          The typing test for people who ship code
        </p>

        {/* 22ch keeps the headline on one line wherever it fits, and two balanced lines on phones */}
        <h1 id="hero-title" className="mt-6 max-w-[22ch] text-display font-bold text-ink">
          {HEADLINE.map((word, i) => (
            <span key={word.text}>
              <span
                // The accent words also get the one-time sheen, half a second after they land
                style={{
                  animationDelay: word.accent
                    ? `${delayOf(1 + i)}s, ${delayOf(1 + i) + 0.5}s`
                    : `${delayOf(1 + i)}s`,
                }}
                className={`inline-block ${
                  word.accent
                    ? '[animation:var(--animate-enter-word),var(--animate-sheen)] text-sheen'
                    : 'animate-enter-word'
                }`}
              >
                {word.text}
              </span>
              {i < HEADLINE.length - 1 && ' '}
            </span>
          ))}
          <span
            aria-hidden
            className="ml-2 inline-block h-[0.8em] w-[0.12em] translate-y-[0.08em] animate-blink-settle bg-caret"
          />
        </h1>

        <p style={step(4)} className="mt-6 max-w-2xl animate-enter font-sans text-lead text-ink-dim">
          Real snippets in {LANGUAGE_COUNT} languages, with every bracket, semicolon and indent that other
          typing tests politely skip.
        </p>

        <div
          style={step(5)}
          className="mt-8 flex w-full animate-enter flex-col justify-center gap-4 sm:w-auto sm:flex-row"
        >
          <ButtonLink href="/play" size="lg">
            Start typing
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
          <ButtonLink href="/play#leaderboard" variant="secondary" size="lg">
            <Trophy size={18} aria-hidden className="text-accent" />
            View leaderboard
          </ButtonLink>
        </div>

        <ul
          style={step(6)}
          className="mt-8 flex animate-enter flex-wrap justify-center gap-y-2 text-sm text-ink-dim"
        >
          {TRUST_STATS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 px-4 sm:border-l sm:border-line-strong sm:first:border-0"
            >
              <Icon size={16} strokeWidth={1.75} aria-hidden className="text-accent" />
              {label}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Sized so the demo's top edge peeks above the fold on a laptop screen */}
      <motion.div
        style={reduce ? undefined : { y: demoY }}
        className="mx-auto mt-12 w-full max-w-3xl px-4 pb-20 sm:px-6"
      >
        <div style={step(7)} className="animate-enter-up">
          <HeroDemo />
        </div>
      </motion.div>
    </section>
  );
}
