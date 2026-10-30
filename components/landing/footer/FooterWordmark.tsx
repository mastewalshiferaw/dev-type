'use client';

import { useMotionValueEvent, useScroll } from 'motion/react';
import { Fragment, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const LETTERS = 'DEV_TYPE'.split('');

/**
 * The footer's closing statement: DEV_TYPE set edge to edge. Outlined at first; as the footer
 * scrolls in, the letters fill in one by one from the left (scroll-scrubbed, so it reads as being
 * typed) with an amber caret riding the edge, which stays blinking after the final letter.
 * Letters lift in a small wave under the mouse. Decorative: the brand name is already in the
 * footer for assistive technology.
 */
export default function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState(LETTERS.length);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    // Finished a little before the very bottom, so the full word is always seen
    setTyped(Math.min(LETTERS.length, Math.floor(progress * 1.25 * (LETTERS.length + 1))));
  });

  const shown = reduce ? LETTERS.length : typed;
  // Zero width so it never pushes letters; as tall as a capital and sitting on the baseline
  const caret = (
    <span className="relative inline-block h-[0.71em] w-0">
      <span className="absolute inset-y-0 left-[0.03em] w-[0.07em] animate-blink bg-accent-fill" />
    </span>
  );

  return (
    // Cropped on purpose: the page edge slices through the underscore (baseline ≈ 0.855em, the
    // underscore reaches 1em). The footer's overflow-x-clip prevents sideways scroll.
    <div
      ref={ref}
      aria-hidden
      data-wordmark
      className="h-[0.95em] overflow-hidden text-[21vw] leading-none select-none"
    >
      <p className="flex items-baseline justify-center font-black tracking-[-0.06em] whitespace-nowrap">
        {LETTERS.map((letter, i) => (
          <Fragment key={i}>
            {i === shown && caret}
            <span className={`wordmark-letter ${i < shown ? 'text-ink' : 'text-transparent'}`}>{letter}</span>
          </Fragment>
        ))}
        {shown === LETTERS.length && caret}
      </p>
    </div>
  );
}
