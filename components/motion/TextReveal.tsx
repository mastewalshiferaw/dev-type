'use client';

import { animate } from 'motion/react';
import { useRef, type ElementType } from 'react';
import { useEnterOnce } from '@/hooks/useEnterOnce';
import { DURATION, EASE_REVEAL, STAGGER_WORDS } from '@/lib/motion';

const PIECE = '[data-text-piece]';

/**
 * Masked slide-up: each word (or each given line) rises out of its own clipping box, a few
 * milliseconds after the previous one. Only `transform` animates; the server renders the finished
 * text, and nothing is hidden above the fold or with reduced motion (see useEnterOnce).
 *
 * Pass `text` for word-by-word, or `lines` to break exactly where you want (the final CTA).
 */
export default function TextReveal({
  as: Tag = 'span',
  text,
  lines,
  id,
  className,
  delay = 0,
}: {
  as?: ElementType;
  text?: string;
  lines?: readonly string[];
  id?: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const pieces = lines ?? text?.split(' ') ?? [];
  const byLine = Boolean(lines);

  useEnterOnce(ref, {
    hide: (el) => {
      for (const piece of el.querySelectorAll<HTMLElement>(PIECE)) piece.style.transform = 'translateY(110%)';
    },
    enter: (el) => {
      el.querySelectorAll<HTMLElement>(PIECE).forEach((piece, i) =>
        animate(
          piece,
          { transform: 'translateY(0%)' },
          { duration: DURATION.reveal, ease: EASE_REVEAL, delay: delay + i * (byLine ? 0.09 : STAGGER_WORDS) }
        )
      );
    },
    reset: (el) => {
      for (const piece of el.querySelectorAll<HTMLElement>(PIECE)) piece.style.removeProperty('transform');
    },
  });

  return (
    <Tag ref={ref} id={id} className={className}>
      {pieces.map((piece, i) => (
        <span key={i} className={byLine ? 'block' : undefined}>
          {/* The clipping box. Vertical padding (pulled back with a negative margin) keeps descenders visible. */}
          <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
            <span data-text-piece className="inline-block">
              {piece}
            </span>
          </span>
          {!byLine && i < pieces.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
