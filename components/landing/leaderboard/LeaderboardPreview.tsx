import { ArrowRight, Trophy } from 'lucide-react';
import LeaderboardRow from '@/components/leaderboard/LeaderboardRow';
import CountUp from '@/components/motion/CountUp';
import Odometer from '@/components/motion/Odometer';
import { Reveal, RevealActive, Stagger } from '@/components/motion/Reveal';
import { Section, SectionHeading } from '@/components/landing/Section';
import { ButtonLink } from '@/components/ui/Button';
import { SAMPLE_LEADERS } from '@/data/landing/leaderboard';

/** A static copy of the app's "Fastest Coders Today" card, with sample scores that count up. */
export default function LeaderboardPreview() {
  return (
    <Section id="leaderboard" className="border-y border-line bg-surface/40">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading id="leaderboard" eyebrow="leaderboard" title="Today's fastest fingers" align="left">
            The sprint resets every 24 hours, so #1 is always up for grabs. Post any timed run, filter by
            language, and see exactly how far you are from the top ten.
          </SectionHeading>
          <div className="flex flex-col gap-4 sm:flex-row">
            <ButtonLink href="/play" size="lg">
              Join the sprint
              <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <ButtonLink href="/play#leaderboard" variant="ghost" size="lg">
              See the live board
            </ButtonLink>
          </div>
        </Reveal>

        <RevealActive>
          <div className="mx-auto w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-lift">
            <header className="mb-4 flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-fill/10 text-accent">
                <Trophy size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-ink">Fastest Coders Today</h3>
                <p className="flex items-center gap-2 text-2xs text-muted">
                  <span aria-hidden className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex size-2 rounded-full bg-success" />
                  </span>
                  Live sprint (24h)
                </p>
              </div>
              <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-muted">Sample</span>
            </header>
            {/* Rows slide in one by one; #1 catches a brief amber light; WPM rolls like an odometer */}
            <Stagger as="ol" variant="slide" itemSelector=":scope > li" className="flex flex-col gap-1">
              {SAMPLE_LEADERS.map((leader, i) => (
                <LeaderboardRow
                  key={leader.username}
                  rank={i + 1}
                  username={leader.username}
                  language={leader.language}
                  className={i === 0 ? 'shine' : ''}
                  wpm={<Odometer value={leader.wpm} delay={0.2 + i * 0.06} />}
                  accuracy={<CountUp value={leader.accuracy} decimals={1} />}
                />
              ))}
            </Stagger>
          </div>
        </RevealActive>
      </div>
    </Section>
  );
}
