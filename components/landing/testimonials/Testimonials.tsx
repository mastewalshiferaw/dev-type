import { Quote, BadgeCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/leaderboard/Avatar';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';
import { Section, SectionHeading } from '@/components/landing/Section';
import { getApprovedTestimonials } from '@/lib/testimonials';

export default async function Testimonials() {
  const testimonials = await getApprovedTestimonials();

  return (
    <Section id="testimonials">
      <SectionHeading id="testimonials" eyebrow="testimonials" title="Overheard in code review">
        A few words from people who stopped practicing on prose.
      </SectionHeading>

      <Stagger as="ul" className="mt-16 grid gap-4 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <StaggerItem as="li" key={testimonial.id || testimonial.name}>
            <figure className="flex h-full flex-col gap-6 rounded-xl border border-line bg-surface p-6 shadow-panel transition-ui hover:-translate-y-0.5 hover:border-line-hover motion-reduce:hover:translate-y-0">
              <div className="flex items-center justify-between">
                <Quote size={20} aria-hidden className="text-accent" />
                {testimonial.wpmRecord ? (
                  <span className="text-3xs rounded-full border border-line bg-canvas px-2.5 py-0.5 font-mono font-bold text-ink">
                    ⚡ {testimonial.wpmRecord} WPM
                  </span>
                ) : null}
              </div>

              <blockquote className="flex-1 font-sans text-base text-pretty text-ink-dim">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              <figcaption className="flex items-center justify-between border-t border-line/50 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar name={testimonial.name} />
                  <span className="flex flex-col">
                    <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                      {testimonial.name}
                      {testimonial.isVerified && (
                        <BadgeCheck size={14} className="text-accent shrink-0" aria-label="Verified user" />
                      )}
                    </span>
                    <span className="font-sans text-xs text-muted">{testimonial.role}</span>
                  </span>
                </div>
              </figcaption>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-10 flex justify-center">
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-ui hover:text-accent"
        >
          Practiced on DevType? Leave a verified testimonial in your account
          <ArrowRight size={14} />
        </Link>
      </div>
    </Section>
  );
}
