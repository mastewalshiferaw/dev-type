'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { CODE_FONTS, type CodeFont, type CursorStyle } from '@/lib/settings';

interface Props {
  text: string;
  input: string;
  cursorStyle: CursorStyle;
  font: CodeFont;
  fontSize: number;
  ligatures: boolean;
  /** Visible text rows; the view scrolls inside this fixed height */
  rows: number;
  /** Color for correctly typed text: green in the app, plain text in the landing demo */
  tone?: 'success' | 'ink';
}

type SegmentKind = 'correct' | 'incorrect' | 'untyped' | 'newline-typed' | 'newline';

interface Segment {
  start: number;
  text: string;
  kind: SegmentKind;
}

/** Row (0-based) the caret is kept on once the text scrolls, leaving one line of context above */
const CARET_ROW = 1;

/**
 * Consecutive characters with the same state share one span, so ligatures can form and the DOM
 * stays small. Line breaks get their own span with a visible ↵ marker.
 */
function buildSegments(text: string, input: string): Segment[] {
  const segments: Segment[] = [];
  let current: Segment | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const typed = i < input.length;
    if (ch === '\n') {
      segments.push({ start: i, text: '↵\n', kind: typed ? 'newline-typed' : 'newline' });
      current = null;
      continue;
    }
    const kind: SegmentKind = !typed ? 'untyped' : input[i] === ch ? 'correct' : 'incorrect';
    if (current && current.kind === kind) {
      current.text += ch;
    } else {
      current = { start: i, text: ch, kind };
      segments.push(current);
    }
  }
  return segments;
}

const KIND_CLASS: Record<SegmentKind, string> = {
  correct: 'text-success',
  incorrect:
    'rounded-xs bg-danger/15 text-danger underline decoration-danger/70 decoration-2 underline-offset-4',
  untyped: 'text-muted',
  'newline-typed': 'text-success opacity-50',
  newline: 'text-muted opacity-50',
};

const INK_CLASS: Record<SegmentKind, string> = {
  ...KIND_CLASS,
  correct: 'text-ink',
  'newline-typed': 'text-ink opacity-50',
};

/** Index of the segment containing `index` (segments are sorted by start). */
function findSegment(segments: Segment[], index: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segments[mid].start <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function CodeView({ text, input, cursorStyle, font, fontSize, ligatures, rows, tone = 'success' }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLPreElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const segmentRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const segments = useMemo(() => buildSegments(text, input), [text, input]);
  const cursor = input.length;

  // Position the caret and scroll the text with direct DOM writes: no re-render per keystroke
  const place = useCallback(() => {
    const content = contentRef.current;
    const caret = caretRef.current;
    if (!content || !caret || segments.length === 0) return;

    const atEnd = cursor >= text.length;
    const index = atEnd ? text.length - 1 : cursor;
    const segmentIndex = findSegment(segments, index);
    const node = segmentRefs.current[segmentIndex]?.firstChild;
    if (!node) return;

    const offset = index - segments[segmentIndex].start;
    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + 1);
    const rect = range.getBoundingClientRect();
    const origin = content.getBoundingClientRect();

    const x = (atEnd ? rect.right : rect.left) - origin.left;
    const y = rect.top - origin.top;
    const width = Math.max(rect.width, fontSize * 0.5);

    caret.style.width = cursorStyle === 'line' ? '2px' : `${width}px`;
    caret.style.height = cursorStyle === 'underline' ? '2px' : `${rect.height}px`;
    const caretY = cursorStyle === 'underline' ? y + rect.height - 2 : y;
    caret.style.transform = `translate(${x}px, ${caretY}px)`;
    caret.hidden = false;

    // Keep the caret on CARET_ROW, but never scroll past the end of the text
    const lineHeight = parseFloat(getComputedStyle(content).lineHeight) || fontSize * 1.6;
    const row = Math.round(y / lineHeight);
    const maxScroll = Math.max(0, content.offsetHeight - rows * lineHeight);
    const scroll = Math.min(Math.max(0, row - CARET_ROW) * lineHeight, maxScroll);
    content.style.transform = `translateY(${-scroll}px)`;

    // Solid while moving, blink once idle
    caret.classList.remove('animate-blink');
    void caret.offsetWidth;
    caret.classList.add('animate-blink');
  }, [segments, cursor, text.length, cursorStyle, fontSize, rows]);

  useLayoutEffect(() => {
    place();
    // Enable the glide only after the first placement so the caret doesn't fly in
    const id = requestAnimationFrame(() => caretRef.current?.setAttribute('data-ready', ''));
    return () => cancelAnimationFrame(id);
  }, [place, font, ligatures]);

  // Re-measure when wrapping changes (resize, font load)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(place);
    observer.observe(viewport);
    document.fonts?.ready.then(place);
    return () => observer.disconnect();
  }, [place]);

  return (
    <div
      ref={viewportRef}
      aria-hidden
      className="relative overflow-hidden"
      style={{
        fontFamily: `${CODE_FONTS[font].variable}, var(--font-mono)`,
        fontSize: `clamp(13px, 3.8vw, ${fontSize}px)`,
        lineHeight: 1.6,
        fontVariantLigatures: ligatures ? 'normal' : 'none',
        height: `${rows}lh`,
      }}
    >
      <pre
        ref={contentRef}
        className="relative m-0 font-[inherit] break-words whitespace-pre-wrap [tab-size:4] motion-safe:transition-transform motion-safe:duration-(--duration-fast) motion-safe:ease-out"
      >
        <span
          ref={caretRef}
          hidden
          className={`pointer-events-none absolute top-0 left-0 rounded-xs data-ready:transition-transform data-ready:duration-(--duration-fast) data-ready:ease-out ${
            cursorStyle === 'block' ? 'bg-caret/35' : 'bg-caret'
          }`}
        />
        {segments.map((segment, i) => (
          <span
            key={segment.start}
            ref={(el) => {
              segmentRefs.current[i] = el;
            }}
            className={tone === 'ink' ? INK_CLASS[segment.kind] : KIND_CLASS[segment.kind]}
          >
            {segment.text}
          </span>
        ))}
      </pre>
    </div>
  );
}

export default memo(CodeView);
