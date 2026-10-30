import type { ReactNode } from 'react';
import { CONTAINER, Eyebrow } from '@/components/landing/Section';

/** Shared layout for the privacy and terms pages. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className={`${CONTAINER} flex-1 py-16 sm:py-24`}>
      <article className="mx-auto max-w-2xl">
        <p>
          <Eyebrow>legal</Eyebrow>
        </p>
        <h1 className="mt-4 text-h2 font-bold text-ink">{title}</h1>
        <p className="mt-2 text-xs text-muted">Last updated {updated}</p>
        <div className="mt-10 flex flex-col gap-6 font-sans text-base text-pretty text-ink-dim [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-4 [&_h2]:font-mono [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
