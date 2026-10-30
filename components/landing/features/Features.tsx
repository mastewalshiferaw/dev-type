import type { ComponentType } from 'react';
import {
  KeyboardVisual,
  LeaderboardVisual,
  ModesVisual,
  SnippetsVisual,
  StatsVisual,
  ThemesVisual,
} from '@/components/landing/features/FeatureVisuals';
import { Stagger, StaggerItem } from '@/components/motion/Reveal';
import { Code, Section, SectionHeading } from '@/components/landing/Section';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { FEATURES, type FeatureId } from '@/data/landing/features';

const VISUALS: Record<FeatureId, ComponentType> = {
  snippets: SnippetsVisual,
  modes: ModesVisual,
  stats: StatsVisual,
  leaderboard: LeaderboardVisual,
  keyboard: KeyboardVisual,
  themes: ThemesVisual,
};

/** Bento grid: 2 + 1 / 1 + 1 + 1 / full-width row on large screens. */
const SPANS: Partial<Record<FeatureId, string>> = {
  snippets: 'md:col-span-2',
  themes: 'md:col-span-2 lg:col-span-3',
};

/** Every card: same padding, radius, border, and a 192px visual so titles line up across a row */
const CARD =
  'h-full overflow-hidden rounded-xl border border-line bg-surface shadow-panel transition-ui hover:border-line-hover';
const VISUAL = 'h-48 bg-canvas/60';
const COPY = 'flex flex-col gap-2 p-6';

export default function Features() {
  return (
    <Section id="features">
      <SectionHeading id="features" eyebrow="features" title="Built for the keys between the letters">
        Your fingers already know <Code>the</Code>. They are less sure about <Code>{'=> {'}</Code>.
      </SectionHeading>

      <Stagger as="ul" variant="clip" className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Visual = VISUALS[feature.id];
          const copy = (
            <div className={COPY}>
              <h3 className="text-base font-bold text-ink">{feature.title}</h3>
              <p className="font-sans text-sm text-muted">{feature.description}</p>
            </div>
          );

          // The themes card spans the row: copy in one column, the two previews across the other two
          if (feature.id === 'themes') {
            return (
              <StaggerItem as="li" key={feature.id} className={SPANS.themes}>
                <SpotlightCard className={`${CARD} flex flex-col lg:grid lg:grid-cols-3`}>
                  <div
                    aria-hidden
                    className={`${VISUAL} border-b border-line lg:order-last lg:col-span-2 lg:border-b-0 lg:border-l`}
                  >
                    <Visual />
                  </div>
                  <div className="lg:flex lg:items-center">{copy}</div>
                </SpotlightCard>
              </StaggerItem>
            );
          }

          return (
            <StaggerItem as="li" key={feature.id} className={SPANS[feature.id] ?? ''}>
              <SpotlightCard className={`${CARD} flex flex-col`}>
                <div aria-hidden className={`${VISUAL} border-b border-line`}>
                  <Visual />
                </div>
                {copy}
              </SpotlightCard>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
