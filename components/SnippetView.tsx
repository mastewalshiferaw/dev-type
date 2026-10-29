'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

interface Props {
  code: string;
  cursor: number;
  mistakes: number[];
  /** Minimum height in text lines, so the panel doesn't jump between snippets */
  minLines: number;
}

export default function SnippetView({ code, cursor, mistakes, minLines }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const wrongSet = useMemo(() => new Set(mistakes), [mistakes]);

  // Move one absolutely-positioned caret to the current character (no per-character DOM churn)
  const placeCaret = useCallback(() => {
    const caret = caretRef.current;
    const target = charRefs.current[cursor];
    if (!caret) return;
    caret.hidden = !target;
    if (!target) return;
    caret.style.height = `${target.offsetHeight}px`;
    caret.style.transform = `translate(${target.offsetLeft}px, ${target.offsetTop}px)`;
    // Stay solid while moving, blink once idle
    caret.classList.remove('animate-blink');
    void caret.offsetWidth;
    caret.classList.add('animate-blink');
  }, [cursor]);

  useLayoutEffect(() => {
    placeCaret();
    // Enable the slide only after the first placement so it doesn't fly in from the corner
    const id = requestAnimationFrame(() => caretRef.current?.setAttribute('data-ready', ''));
    return () => cancelAnimationFrame(id);
  }, [placeCaret, code]);

  // Re-measure when wrapping changes (resize, font load)
  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;
    const observer = new ResizeObserver(placeCaret);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [placeCaret]);

  return (
    <pre
      ref={preRef}
      style={{ minHeight: `${minLines}lh` }}
      className="relative m-0 whitespace-pre-wrap break-words text-base text-muted [font-variant-ligatures:none] [tab-size:4] sm:text-lg"
    >
      <span
        ref={caretRef}
        aria-hidden
        className="pointer-events-none absolute -left-px top-0 w-0.5 rounded-full bg-accent data-ready:transition-transform data-ready:duration-100 data-ready:ease-out"
      />
      {code.split('').map((char, index) => {
        const typed = index < cursor;
        const wrong = typed && wrongSet.has(index);
        const tone = !typed
          ? ''
          : wrong
            ? 'rounded-xs bg-danger/15 text-danger underline decoration-danger/70 decoration-2 underline-offset-4'
            : 'text-success';
        return (
          <span
            key={index}
            ref={(el) => {
              charRefs.current[index] = el;
            }}
            className={tone}
          >
            {char === '\n' ? <span className="opacity-60">{'↵\n'}</span> : char}
          </span>
        );
      })}
    </pre>
  );
}
