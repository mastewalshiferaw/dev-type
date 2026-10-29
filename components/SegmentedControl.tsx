'use client';

import type { LucideIcon } from 'lucide-react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  label: string;
  icon: LucideIcon;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string | number>({
  label,
  icon: Icon,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      <Icon size={14} aria-hidden className="mx-2 shrink-0 text-accent" />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`transition-ui h-10 min-w-10 rounded-md px-3 text-xs ${
              active
                ? 'bg-raised font-semibold text-accent shadow-[inset_0_0_0_1px_var(--color-line-strong)]'
                : 'text-muted hover:bg-raised/60 hover:text-ink active:bg-raised'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
