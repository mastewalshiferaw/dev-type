import type { ReactNode } from 'react';
import TextReveal from '@/components/motion/TextReveal';
import TypeIn from '@/components/motion/TypeIn';

/** Max content width with the page gutters (the `page-container` utility in globals.css). */
export const CONTAINER = 'page-container';

/** A landing section. Its heading must use the id `${id}-title`. */
export function Section({
  id,
  className = '',
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-16 section-y ${className}`}>
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}

/** Mono micro-label with a code-comment prefix ("// features"), typed in as it scrolls into view. */
export function Eyebrow({ children }: { children: string }) {
  return <TypeIn text={`// ${children}`} className="label text-accent" />;
}

/** Eyebrow, title and intro for a section. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  children,
  align = 'center',
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  align?: 'center' | 'left';
}) {
  const centered = align === 'center';
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${centered ? 'mx-auto items-center text-center' : ''}`}>
      <p>
        <Eyebrow>{eyebrow}</Eyebrow>
      </p>
      {typeof title === 'string' ? (
        <TextReveal as="h2" id={`${id}-title`} text={title} className="text-h2 font-bold text-ink" />
      ) : (
        <h2 id={`${id}-title`} className="text-h2 font-bold text-ink">
          {title}
        </h2>
      )}
      {children && <p className="font-sans text-lead text-ink-dim">{children}</p>}
    </div>
  );
}

/** Inline code inside body copy. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-xs border border-line bg-raised px-1 font-mono text-[0.9em] text-ink">
      {children}
    </code>
  );
}
