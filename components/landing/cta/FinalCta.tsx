import { ArrowRight } from 'lucide-react';
import { CONTAINER, Eyebrow } from '@/components/landing/Section';
import Magnetic from '@/components/motion/Magnetic';
import { RevealActive } from '@/components/motion/Reveal';
import TextReveal from '@/components/motion/TextReveal';
import { ButtonLink } from '@/components/ui/Button';
import Kbd from '@/components/ui/Kbd';

export default function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className={`${CONTAINER} pb-24 sm:pb-32`}>
      {/* The glow and dots stay inside the card (overflow-hidden); the border sweeps once on scroll-in */}
      <RevealActive className="border-sweep relative isolate flex flex-col items-center overflow-hidden rounded-xl border border-line-strong bg-surface glow-top px-6 py-16 text-center shadow-panel sm:py-24">
        <div aria-hidden className="absolute inset-0 -z-10 bg-dots fade-radial" />
        <p>
          <Eyebrow>ready?</Eyebrow>
        </p>
        {/* Line by line, each rising out of its own mask */}
        <TextReveal
          as="h2"
          id="cta-title"
          lines={["Your next PR won't", 'type itself.']}
          className="mt-4 max-w-3xl text-headline font-bold text-ink"
        />
        <p className="mt-6 max-w-xl font-sans text-lead text-ink-dim">
          Thirty seconds is all it takes to find your baseline. Beating it takes a little longer.
        </p>
        <Magnetic className="mt-10">
          <ButtonLink href="/play" size="lg">
            Start typing
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </Magnetic>
        <p className="mt-6 text-xs text-muted">
          Fumbled the first line? Press <Kbd>Tab</Kbd> to restart.
        </p>
      </RevealActive>
    </section>
  );
}
