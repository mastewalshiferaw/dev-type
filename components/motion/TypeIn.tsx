'use client';

import { useRef } from 'react';
import { useEnterOnce } from '@/hooks/useEnterOnce';

const CHAR_MS = 32;

/**
 * Text that types itself in, one character at a time, when it scrolls into view (the `// label`
 * kickers). Text is written straight to the DOM, so React never re-renders per character; screen
 * readers get the full text from the start via the visually hidden copy.
 */
export default function TypeIn({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef(0);

  useEnterOnce(ref, {
    hide: (el) => {
      el.textContent = '';
    },
    enter: (el) => {
      let shown = 0;
      timer.current = window.setInterval(() => {
        shown += 1;
        el.textContent = text.slice(0, shown);
        if (shown >= text.length) window.clearInterval(timer.current);
      }, CHAR_MS);
    },
    reset: (el) => {
      window.clearInterval(timer.current);
      el.textContent = text;
    },
  });

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {/* Reserves the final width so typing never reflows the line */}
      <span aria-hidden className="relative inline-block whitespace-pre">
        <span className="invisible">{text}</span>
        <span ref={ref} className="absolute inset-0">
          {text}
        </span>
      </span>
    </span>
  );
}
