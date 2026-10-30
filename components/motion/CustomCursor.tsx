'use client';

import { useEffect, useRef } from 'react';

type CursorState = 'default' | 'link' | 'text' | 'hidden';

const INTERACTIVE = 'a, button, [role="button"], summary, label, select, [data-cursor="link"]';
/** How far the ring closes the gap each frame (the dot itself is exact) */
const RING_LERP = 0.22;

/**
 * A small amber dot that follows the mouse, grows into a ring over anything clickable and turns
 * into an I-beam over the typing demo. It is a companion, not a replacement: the native cursor
 * stays visible. Loaded lazily by LandingShell, and only for a fine pointer without reduced
 * motion. Positions are written straight to `transform`; the loop sleeps when the ring settles.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const target = { x: -100, y: -100 };
    const ringPos = { x: -100, y: -100 };
    let frame = 0;

    const setState = (state: CursorState) => {
      if (root.dataset.state !== state) root.dataset.state = state;
    };

    const tick = () => {
      ringPos.x += (target.x - ringPos.x) * RING_LERP;
      ringPos.y += (target.y - ringPos.y) * RING_LERP;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      const settled = Math.abs(target.x - ringPos.x) < 0.1 && Math.abs(target.y - ringPos.y) < 0.1;
      frame = settled ? 0 : requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return setState('hidden');
      target.x = event.clientX;
      target.y = event.clientY;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      const el = event.target as Element | null;
      setState(el?.closest('[data-cursor="text"]') ? 'text' : el?.closest(INTERACTIVE) ? 'link' : 'default');
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeave = () => setState('hidden');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-state="hidden"
      className="custom-cursor pointer-events-none fixed inset-0 z-[80]"
    >
      <div ref={ringRef} className="absolute top-0 left-0">
        <span className="cursor-ring" />
      </div>
      <div ref={dotRef} className="absolute top-0 left-0">
        <span className="cursor-dot" />
        <span className="cursor-beam" />
      </div>
    </div>
  );
}
