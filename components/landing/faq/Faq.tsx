'use client';

import { useState } from 'react';
import { Reveal } from '@/components/motion/Reveal';
import { Section, SectionHeading } from '@/components/landing/Section';
import { FAQ } from '@/data/landing/faq';

/**
 * Accordion (WAI-ARIA pattern): each question is a button in a heading with aria-expanded and
 * aria-controls; each answer is a labelled region. Closed answers stay in the DOM for search
 * engines but are `inert`, so they are skipped by keyboard and screen readers.
 */
export default function Faq() {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]));

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <Section id="faq">
      <SectionHeading id="faq" eyebrow="faq" title="Questions, answered" />

      <Reveal className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-xl border border-line bg-surface shadow-panel">
        {FAQ.map((item, i) => {
          const expanded = open.has(i);
          return (
            <div key={item.question}>
              <h3>
                <button
                  type="button"
                  id={`faq-q-${i}`}
                  aria-expanded={expanded}
                  aria-controls={`faq-a-${i}`}
                  onClick={() => toggle(i)}
                  className="flex w-full items-center justify-between gap-4 rounded-xl px-6 py-5 text-left text-sm font-semibold text-ink transition-ui hover:text-accent active:translate-y-px sm:text-base"
                >
                  {item.question}
                  {/* Plus that folds into a minus: the vertical bar turns flat as the answer opens */}
                  <span aria-hidden className="relative size-4 shrink-0 text-muted">
                    <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
                    <span
                      className={`absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current transition-transform duration-(--duration-slow) ease-out ${
                        expanded ? 'rotate-90' : 'rotate-0'
                      }`}
                    />
                  </span>
                </button>
              </h3>
              <div
                id={`faq-a-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                inert={!expanded}
                className={`grid transition-[grid-template-rows] duration-(--duration-base) ease-out ${
                  expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 font-sans text-sm text-pretty text-muted sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </Reveal>
    </Section>
  );
}
