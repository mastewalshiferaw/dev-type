'use client';

import { animate } from 'motion/react';
import { useRef } from 'react';
import { useEnterOnce } from '@/hooks/useEnterOnce';
import { EASE_REVEAL } from '@/lib/motion';

/**
 * A number that counts up from zero the first time it scrolls into view. The server renders the
 * final value, so crawlers, screen readers and reduced-motion users get the real number, and
 * numbers already on screen at load simply stay put.
 */
export default function CountUp({
  value,
  decimals = 0,
  duration = 1.4,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const controls = useRef<ReturnType<typeof animate>>(undefined);
  const format = (n: number) => n.toFixed(decimals);

  useEnterOnce(ref, {
    hide: (el) => {
      el.textContent = format(0);
    },
    enter: (el) => {
      controls.current = animate(0, value, {
        duration,
        ease: EASE_REVEAL,
        onUpdate: (n) => {
          el.textContent = format(n);
        },
      });
    },
    reset: (el) => {
      controls.current?.stop();
      el.textContent = format(value);
    },
  });

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
    </span>
  );
}
