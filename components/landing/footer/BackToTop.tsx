'use client';

import { ArrowUp } from 'lucide-react';
import { useScrollTo } from '@/components/motion/SmoothScroll';
import { buttonClass } from '@/components/ui/Button';

/** Smooth-scrolls to the top, then puts keyboard focus on the page's main heading. */
export default function BackToTop() {
  const scrollTo = useScrollTo();
  return (
    <button
      type="button"
      onClick={() => {
        scrollTo(0);
        const heading = document.querySelector<HTMLElement>('main h1');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }}
      className={buttonClass('ghost', 'sm')}
    >
      Back to top
      <ArrowUp size={14} aria-hidden />
    </button>
  );
}
