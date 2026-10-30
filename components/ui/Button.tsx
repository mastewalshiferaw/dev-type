import Link from 'next/link';
import type { ComponentProps } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/**
 * Every button state in one place: hover, focus-visible (global ring in globals.css), active
 * (presses down 1px) and disabled. Touch sizes stay at 44px or more below the `sm` breakpoint.
 */
const BASE =
  'inline-flex shrink-0 select-none items-center justify-center rounded-md whitespace-nowrap transition-ui active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-fill font-bold text-accent-ink shadow-cta hover:bg-accent-fill-hover',
  secondary:
    'border border-line-strong font-semibold text-ink hover:border-line-hover hover:bg-raised/60 active:bg-raised',
  ghost: 'font-semibold text-muted hover:bg-raised hover:text-ink active:bg-raised',
};

const SIZES: Record<Size, string> = {
  sm: 'h-11 gap-2 px-4 text-xs sm:h-9 sm:px-3',
  md: 'h-11 gap-2 px-4 text-sm sm:h-10',
  lg: 'h-12 gap-2 px-6 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

/** Square icon button: 44px touch target on phones, 36px from `sm`. */
export const ICON_BUTTON = `${BASE} size-11 text-muted hover:bg-raised hover:text-ink active:bg-raised sm:size-9`;

/** A link styled as a button (every CTA on the landing page navigates). */
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}
