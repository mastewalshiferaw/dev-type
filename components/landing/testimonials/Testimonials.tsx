import { Quote } from 'lucide-react';
import Avatar from '@/components/leaderboard/Avatar';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';
import { Section, SectionHeading } from '@/components/landing/Section';
import { TESTIMONIALS } from '@/data/landing/testimonials';

// PLACEHOLDER: the quotes come from data/landing/testimonials.ts and are not real yet.
export default function Testimonials() {
  return (
    <Section id="testimonials">
      <SectionHeading id="testimonials" eyebrow="testimonials" title="Overheard in code review">
        A few words from people who stopped practicing on prose.
      </SectionHeading>

      <Stagger as="ul" className="mt-16 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <StaggerItem as="li" key={testimonial.name}>
            <figure className="flex h-full flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-panel transition-ui hover:-translate-y-0.5 hover:border-line-hover motion-reduce:hover:translate-y-0">
              <Quote size={20} aria-hidden className="text-accent" />
              <blockquote className="flex-1 font-sans text-base text-pretty text-ink-dim">
                {testimonial.quote}
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar name={testimonial.name} />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-ink">{testimonial.name}</span>
                  <span className="font-sans text-xs text-muted">{testimonial.role}</span>
                </span>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
