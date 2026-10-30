'use client';

import { animate } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { useEnterOnce } from '@/hooks/useEnterOnce';
import { DURATION, EASE_REVEAL, STAGGER } from '@/lib/motion';

/**
 * Scroll entrances, built on `useEnterOnce` (server renders the finished state; below-the-fold
 * content enters once; reduced motion shows everything still).
 *
 * - `rise`: fade in and rise 12px.
 * - `clip`: a wipe upward with clip-path (the bento cards), with a 12px rise.
 * - `slide`: fade in from 16px to the left (leaderboard rows).
 */

export type RevealVariant = 'rise' | 'clip' | 'slide';

const HIDDEN: Record<RevealVariant, Keyframe> = {
  rise: { opacity: '0', transform: 'translateY(12px)' },
  clip: { clipPath: 'inset(100% 0% 0% 0% round 20px)', transform: 'translateY(12px)' },
  slide: { opacity: '0', transform: 'translateX(-16px)' },
};
const SHOWN: Record<RevealVariant, Record<string, string | number>> = {
  rise: { opacity: 1, transform: 'translateY(0px)' },
  clip: { clipPath: 'inset(0% 0% 0% 0% round 20px)', transform: 'translateY(0px)' },
  slide: { opacity: 1, transform: 'translateX(0px)' },
};

const ITEM_SELECTOR = '[data-reveal-item]';

function targetsOf(root: HTMLElement, staggered: boolean, selector = ITEM_SELECTOR): HTMLElement[] {
  return staggered ? [...root.querySelectorAll<HTMLElement>(selector)] : [root];
}

function useReveal(
  ref: React.RefObject<HTMLElement | null>,
  {
    staggered,
    variant,
    selector,
    onEnter,
  }: { staggered: boolean; variant: RevealVariant; selector?: string; onEnter?: (el: HTMLElement) => void }
) {
  useEnterOnce(ref, {
    hide: (root) => {
      for (const target of targetsOf(root, staggered, selector)) Object.assign(target.style, HIDDEN[variant]);
    },
    enter: (root) => {
      targetsOf(root, staggered, selector).forEach((target, i) =>
        animate(target, SHOWN[variant], {
          duration: DURATION.reveal,
          ease: EASE_REVEAL,
          delay: i * STAGGER,
        }).then(() => {
          // Hand the element back to CSS (hover transforms, no lingering clip)
          target.style.removeProperty('clip-path');
          target.style.removeProperty('transform');
        })
      );
      onEnter?.(root);
    },
    reset: (root) => {
      for (const target of targetsOf(root, staggered, selector)) {
        target.style.removeProperty('opacity');
        target.style.removeProperty('transform');
        target.style.removeProperty('clip-path');
      }
    },
  });
}

type Tag = 'div' | 'ul' | 'ol' | 'li';

interface Props {
  as?: Tag;
  className?: string;
  variant?: RevealVariant;
  children: ReactNode;
}

/** Reveals one block. */
export function Reveal({ as: Tag = 'div', className, variant = 'rise', children }: Props) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { staggered: false, variant });
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Reveals its `StaggerItem` children one after another, 60ms apart. `itemSelector` picks other
 * children instead (`:scope > li` when the items render their own <li>).
 */
export function Stagger({
  as: Tag = 'div',
  className,
  variant = 'rise',
  itemSelector,
  children,
}: Props & { itemSelector?: string }) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, { staggered: true, variant, selector: itemSelector });
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ as: Tag = 'div', className, children }: Omit<Props, 'variant'>) {
  return (
    <Tag data-reveal-item className={className}>
      {children}
    </Tag>
  );
}

/**
 * Reveals one block and sets `data-active` on it as it enters, for one-shot CSS effects (the
 * `border-sweep` and `shimmer` utilities). With reduced motion it is never set.
 */
export function RevealActive({ as: Tag = 'div', className, children }: Omit<Props, 'variant'>) {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref, {
    staggered: false,
    variant: 'rise',
    onEnter: (el) => {
      el.dataset.active = '';
    },
  });
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
