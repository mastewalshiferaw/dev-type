'use client';

import { motion } from 'motion/react';
import { useId, useRef, type KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
}

/**
 * Radio group with roving focus (arrow keys move and select) and a sliding highlight.
 */
export default function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
  icon: Icon,
  size = 'md',
}: Props<T>) {
  const pillId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const onKeyDown = (event: KeyboardEvent) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    const jump = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : null;
    if (!step && jump === null) return;
    event.preventDefault();
    const index = jump ?? (activeIndex + step + options.length) % options.length;
    onChange(options[index].value);
    refs.current[index]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 items-center gap-0.5">
      {Icon && <Icon size={14} aria-hidden className="mx-1.5 shrink-0 text-accent" />}
      {options.map((option, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={onKeyDown}
            className={`relative shrink-0 rounded-md whitespace-nowrap transition-ui ${
              size === 'sm' ? 'h-8 px-2 text-2xs' : 'h-9 min-w-9 px-2 text-xs'
            } ${active ? 'font-semibold text-accent' : 'text-muted hover:text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                aria-hidden
                className="absolute inset-0 rounded-md bg-raised shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
