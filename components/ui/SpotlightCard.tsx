'use client';

import type { PointerEvent, ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER } from '@/lib/motion';

/** Maximum tilt, in degrees, at the card's edges */
const TILT = 4;

/**
 * A card with a soft highlight that follows the cursor and a slight 3D tilt toward it (4° at most).
 * Only CSS variables and an inline transform change, so React never re-renders on pointer moves.
 * Mouse only; the `spotlight` utility and this component both stand down for touch and for
 * reduced motion.
 */
export default function SpotlightCard({
  className = '',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty('--spot-x', `${x}px`);
    el.style.setProperty('--spot-y', `${y}px`);
    if (reduce || !window.matchMedia(FINE_POINTER).matches) return;
    const rotateY = (x / rect.width - 0.5) * 2 * TILT;
    const rotateX = (0.5 - y / rect.height) * 2 * TILT;
    el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  };

  return (
    <article
      onPointerMove={onPointerMove}
      onPointerLeave={(event) => event.currentTarget.style.removeProperty('transform')}
      className={`spotlight ${className}`}
    >
      {children}
    </article>
  );
}
