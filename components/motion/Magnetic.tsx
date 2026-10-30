'use client';

import { motion, useMotionValue, useSpring } from 'motion/react';
import type { PointerEvent, ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FINE_POINTER, SPRING_SOFT } from '@/lib/motion';

const PULL = 0.3;
const MAX = 10;

/**
 * Pulls its child up to 10px toward the cursor while hovered and springs back on leave, then
 * squashes briefly on press like a keycap. Mouse only; with reduced motion it is a plain wrapper.
 */
export default function Magnetic({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), SPRING_SOFT);
  const y = useSpring(useMotionValue(0), SPRING_SOFT);

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (reduce || event.pointerType !== 'mouse' || !window.matchMedia(FINE_POINTER).matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const clamp = (n: number) => Math.max(-MAX, Math.min(MAX, n));
    x.set(clamp((event.clientX - rect.left - rect.width / 2) * PULL));
    y.set(clamp((event.clientY - rect.top - rect.height / 2) * PULL));
  };
  const release = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      onPointerMove={onPointerMove}
      onPointerLeave={release}
      style={reduce ? undefined : { x, y }}
      whileTap={reduce ? undefined : { scaleX: 1.04, scaleY: 0.9, transition: { duration: 0.08 } }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  );
}
