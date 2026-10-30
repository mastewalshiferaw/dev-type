'use client';

import { useId } from 'react';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Switch({ label, description, checked, onChange }: Props) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-ui ${
          checked ? 'border-accent-fill bg-accent-fill' : 'border-line-strong bg-raised'
        }`}
      >
        <span
          aria-hidden
          className={`inline-block size-4 rounded-full shadow-sm transition-ui ${
            checked ? 'translate-x-[1.125rem] bg-accent-ink' : 'translate-x-1 bg-muted'
          }`}
        />
      </button>
    </div>
  );
}
