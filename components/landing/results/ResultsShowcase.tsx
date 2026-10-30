import { Check } from 'lucide-react';
import CountUp from '@/components/motion/CountUp';
import { Reveal } from '@/components/motion/Reveal';
import { Section, SectionHeading } from '@/components/landing/Section';
import ShowcaseChart from '@/components/landing/results/ShowcaseChart';
import { SHOWCASE_STATS } from '@/data/landing/showcase';

const POINTS = [
  'Raw against net WPM shows exactly what your mistakes cost.',
  'Consistency scores how steady your rhythm is, second by second.',
  'Personal bests are kept per language and mode, so progress stays honest.',
];

const STATS = [
  { label: 'wpm', value: SHOWCASE_STATS.wpm, unit: '' },
  { label: 'raw', value: SHOWCASE_STATS.raw, unit: '' },
  { label: 'accuracy', value: SHOWCASE_STATS.accuracy, unit: '%' },
  { label: 'consistency', value: SHOWCASE_STATS.consistency, unit: '%' },
];

export default function ResultsShowcase() {
  return (
    <Section id="results">
      <div className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading id="results" eyebrow="results" title="Know why you're slow" align="left">
            WPM is the headline. The chart is the story: where you sped up, where one bracket cost you two
            seconds, and whether you are steady or just fast in bursts.
          </SectionHeading>
          <ul className="flex flex-col gap-3 font-sans text-sm text-ink-dim">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <Check size={18} aria-hidden className="mt-px shrink-0 text-success" />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          {/* A mock results screen built from the sample run in data/landing/showcase.ts */}
          <div className="rounded-xl border border-line bg-surface p-6 shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="label text-muted">Run complete</h3>
                <p className="text-xs text-ink-dim">
                  {SHOWCASE_STATS.language} · {SHOWCASE_STATS.mode}
                </p>
              </div>
              <span className="rounded-full border border-line px-2 py-0.5 text-2xs text-muted">
                Sample run
              </span>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <dt className="label text-muted">{stat.label}</dt>
                  <dd
                    className={`font-bold tabular-nums ${i === 0 ? 'text-5xl text-accent' : 'text-3xl text-ink'}`}
                  >
                    <CountUp value={stat.value} decimals={Number.isInteger(stat.value) ? 0 : 1} />
                    {stat.unit}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <ShowcaseChart />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
