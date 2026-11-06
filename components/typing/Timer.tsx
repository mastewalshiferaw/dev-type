'use client';

import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Clock, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DURATIONS, type Duration } from '@/lib/settings';

interface Props {
  /** Seconds to show */
  seconds: number;
  /** Count down (time mode) or up */
  countdown: boolean;
  urgent: boolean;
  currentDuration?: Duration;
  onSelectDuration?: (duration: Duration) => void;
}

const format = (seconds: number) =>
  seconds >= 60 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : `${seconds}`;

export default function Timer({ seconds, countdown, urgent, currentDuration = 30, onSelectDuration }: Props) {
  const [open, setOpen] = useState(false);

  const cycleNext = () => {
    if (!onSelectDuration) return;
    const nextIdx = (DURATIONS.indexOf(currentDuration) + 1) % DURATIONS.length;
    onSelectDuration(DURATIONS[nextIdx]);
    setOpen(false);
  };

  const timerContent = (
    <>
      <motion.span
        // Re-mounting on each second replays the pulse during the final countdown
        key={urgent ? seconds : 'steady'}
        initial={urgent ? { scale: 1.25 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`inline-block min-w-[3ch] origin-left text-3xl font-bold tabular-nums transition-colors ${
          urgent ? 'text-danger' : 'text-accent group-hover:text-accent-strong'
        }`}
      >
        {format(seconds)}
      </motion.span>
      <span className="flex items-center gap-1 label text-muted group-hover:text-ink">
        {countdown ? 'left' : 'elapsed'}
        {onSelectDuration && (
          <ChevronDown
            size={12}
            className="opacity-60 transition-transform group-hover:opacity-100 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        )}
      </span>
    </>
  );

  if (!onSelectDuration) {
    return <div className="flex items-baseline gap-2">{timerContent}</div>;
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => {
            if (e.shiftKey) {
              e.preventDefault();
              cycleNext();
            }
          }}
          className="group -mx-2 -my-1 flex cursor-pointer items-baseline gap-2 rounded-lg px-2 py-1 text-left transition-ui hover:bg-raised/70 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          aria-label={`Timer: ${format(seconds)} ${
            countdown ? 'seconds left' : 'seconds elapsed'
          }. Click to change duration (Shift+click to cycle).`}
          title="Click to change timer duration (15s, 30s, 60s, 120s)"
        >
          {timerContent}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 flex flex-col gap-2 rounded-xl border border-line bg-surface p-2.5 shadow-modal data-[state=open]:animate-pop"
        >
          <div className="flex items-center justify-between gap-4 px-1">
            <span className="flex items-center gap-1.5 text-3xs font-semibold tracking-wider text-muted uppercase">
              <Clock size={11} aria-hidden />
              Timer Duration
            </span>
            <button
              type="button"
              onClick={cycleNext}
              className="flex items-center gap-1 text-3xs font-medium text-accent hover:underline"
              title="Switch to next duration"
            >
              <RotateCcw size={10} aria-hidden />
              Cycle next
            </button>
          </div>

          <div className="flex items-center gap-1">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  onSelectDuration(d);
                  setOpen(false);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold tabular-nums transition-ui ${
                  countdown && currentDuration === d
                    ? 'bg-accent-fill text-accent-ink shadow-xs'
                    : 'text-muted hover:bg-raised hover:text-ink'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          <Popover.Arrow className="fill-line" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
