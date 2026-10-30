'use client';

import { animate, useInView } from 'motion/react';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import { SHOWCASE_SAMPLES } from '@/data/landing/showcase';
import { useEnterOnce } from '@/hooks/useEnterOnce';
import { EASE } from '@/lib/motion';

// The app's own results chart. Recharts is only downloaded when this section gets close.
const WpmChart = dynamic(() => import('@/components/results/WpmChart'), {
  ssr: false,
  loading: () => <Skeleton className="h-[17rem]" />,
});

/**
 * The sample run's chart, drawn left to right as it scrolls in: a clip-path wipe that runs at a
 * steady pace, so the WPM line traces itself and each error bar appears at its own second.
 * Only the plot wipes; the legend and the table toggle are there from the start.
 */
export default function ShowcaseChart() {
  const ref = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: '400px 0px' });

  useEnterOnce(
    plotRef,
    {
      hide: (el) => {
        el.style.clipPath = 'inset(0% 100% 0% 0%)';
      },
      enter: (el) => {
        animate(el, { clipPath: 'inset(0% 0% 0% 0%)' }, { duration: 1.6, ease: EASE, delay: 0.2 }).then(() =>
          el.style.removeProperty('clip-path')
        );
      },
      reset: (el) => el.style.removeProperty('clip-path'),
    },
    '0px 0px -25% 0px'
  );

  return (
    // Fixed minimum height so nothing shifts when the chart arrives
    <div ref={ref} className="min-h-[17rem]">
      <div ref={plotRef}>
        {near ? <WpmChart samples={SHOWCASE_SAMPLES} /> : <Skeleton className="h-[17rem]" />}
      </div>
    </div>
  );
}
