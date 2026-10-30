'use client';

import { motion } from 'motion/react';

interface Props {
  /** Seconds to show */
  seconds: number;
  /** Count down (time mode) or up */
  countdown: boolean;
  urgent: boolean;
}

const format = (seconds: number) =>
  seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `${seconds}`;

export default function Timer({ seconds, countdown, urgent }: Props) {
  return (
    <div className="flex items-baseline gap-2">
      <motion.span
        // Re-mounting on each second replays the pulse during the final countdown
        key={urgent ? seconds : 'steady'}
        initial={urgent ? { scale: 1.25 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`inline-block min-w-[3ch] origin-left text-3xl font-bold tabular-nums ${
          urgent ? 'text-danger' : 'text-accent'
        }`}
      >
        {format(seconds)}
      </motion.span>
      <span className="label text-muted">{countdown ? 'left' : 'elapsed'}</span>
    </div>
  );
}
