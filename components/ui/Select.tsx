'use client';

import { ChevronDown, type LucideIcon } from 'lucide-react';

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  icon?: LucideIcon;
  /** Show the label to sighted users too (otherwise it is screen-reader only) */
  showLabel?: boolean;
  className?: string;
}

/**
 * Native <select> styled as a pill: keyboard, screen reader and mobile pickers work for free,
 * and long option lists scroll instead of overflowing the toolbar.
 */
export default function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  showLabel = false,
  className = '',
}: Props<T>) {
  return (
    <label className={`flex shrink-0 items-center gap-2 ${className}`}>
      <span className={showLabel ? 'text-sm text-ink' : 'sr-only'}>{label}</span>
      <span className="relative flex items-center">
        {Icon && <Icon size={14} aria-hidden className="pointer-events-none absolute left-2.5 text-accent" />}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={`h-9 cursor-pointer appearance-none rounded-md border border-line bg-surface pr-8 text-xs font-semibold text-ink transition-ui hover:border-line-strong ${
            Icon ? 'pl-8' : 'pl-3'
          }`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-2.5 text-muted" />
      </span>
    </label>
  );
}
