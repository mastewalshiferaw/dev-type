'use client';

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Copies of the items per half of the track: enough to cover a 2560px screen with short lists */
const COPIES = 3;

/**
 * An endless row that drifts at `speed` px/s. Scrolling the page speeds it up and skews it
 * slightly in the scroll direction; both ease back when scrolling stops. It stops entirely
 * while off-screen, while hovered or focused, and when `paused`.
 *
 * Children are one copy of the items; the visible copy is announced once and the repeats are
 * aria-hidden. With reduced motion `fallback` renders instead (a still layout of the same items).
 */
export default function Marquee({
  children,
  direction = 1,
  speed = 40,
  paused = false,
  className = '',
  fallback,
}: {
  children: ReactNode;
  direction?: 1 | -1;
  speed?: number;
  paused?: boolean;
  className?: string;
  /** Rendered instead with reduced motion (defaults to the children, still) */
  fallback?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const halfRef = useRef<HTMLDivElement>(null);
  const [halfWidth, setHalfWidth] = useState(0);
  const [held, setHeld] = useState(false);
  const inView = useInView(rootRef);

  const offset = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 300 });
  const boost = useTransform(velocity, [-2000, 0, 2000], [4, 0, 4]);
  const skewX = useTransform(velocity, [-2500, 2500], [5 * direction, -5 * direction], { clamp: true });

  useEffect(() => {
    const half = halfRef.current;
    if (!half) return;
    const observer = new ResizeObserver(() => setHalfWidth(half.offsetWidth));
    observer.observe(half);
    return () => observer.disconnect();
  }, [reduce]);

  useAnimationFrame((_, delta) => {
    if (reduce || paused || held || !inView || !halfWidth) return;
    const step = ((speed * delta) / 1000) * (1 + boost.get());
    // Wrap within one half: the second half is identical, so the jump is invisible
    let next = offset.get() - step * direction;
    if (next <= -halfWidth) next += halfWidth;
    if (next > 0) next -= halfWidth;
    offset.set(next);
  });

  if (reduce) return <>{fallback === undefined ? children : fallback}</>;

  const half = (hidden: boolean) => (
    <div ref={hidden ? undefined : halfRef} aria-hidden={hidden || undefined} className="flex shrink-0">
      {Array.from({ length: COPIES }, (_, i) => (
        <div key={i} aria-hidden={(!hidden && i > 0) || undefined} className="flex shrink-0">
          {children}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden ${className}`}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <motion.div style={{ x: offset, skewX }} className="flex w-max will-change-transform">
        {half(false)}
        {half(true)}
      </motion.div>
    </div>
  );
}
