'use client';

import { animate } from 'motion/react';
import { useRef } from 'react';
import { useEnterOnce } from '@/hooks/useEnterOnce';
import { EASE_REVEAL } from '@/lib/motion';

const DIGITS = '0123456789';

/**
 * An integer whose digits roll into place like an odometer when it scrolls into view. Each digit
 * is a 0–9 column moved with `transform`; the server renders the final digits. Screen readers
 * read the plain number.
 */
export default function Odometer({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const digits = String(Math.round(value)).split('');

  useEnterOnce(ref, {
    hide: (el) => {
      for (const column of el.querySelectorAll<HTMLElement>('[data-digit]'))
        column.style.transform = 'translateY(0%)';
    },
    enter: (el) => {
      el.querySelectorAll<HTMLElement>('[data-digit]').forEach((column, i, all) =>
        animate(
          column,
          { transform: `translateY(-${Number(column.dataset.digit) * 10}%)` },
          // The last digit spins longest, like a real counter
          { duration: 1 + (i / Math.max(all.length - 1, 1)) * 0.5, ease: EASE_REVEAL, delay }
        )
      );
    },
    reset: (el) => {
      for (const column of el.querySelectorAll<HTMLElement>('[data-digit]'))
        column.style.transform = `translateY(-${Number(column.dataset.digit) * 10}%)`;
    },
  });

  return (
    <span className="tabular-nums">
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden className="inline-flex h-[1em] overflow-hidden leading-none">
        {digits.map((digit, i) => (
          <span
            key={i}
            data-digit={digit}
            className="flex flex-col"
            style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
          >
            {DIGITS.split('').map((d) => (
              <span key={d} className="h-[1em]">
                {d}
              </span>
            ))}
          </span>
        ))}
      </span>
    </span>
  );
}
