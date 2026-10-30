'use client';

import { motion, useScroll, useSpring } from 'motion/react';

/** A 2px amber bar along the top of the viewport showing how far down the page you are. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent-fill"
    />
  );
}
