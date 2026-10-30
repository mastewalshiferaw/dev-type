'use client';

import { Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { Code, SectionHeading } from '@/components/landing/Section';
import Marquee from '@/components/motion/Marquee';
import { ICON_BUTTON } from '@/components/ui/Button';
import { LANDING_LANGUAGES, LANGUAGE_COUNT } from '@/data/landing/languages';

type Language = (typeof LANDING_LANGUAGES)[number];

const HALF = Math.ceil(LANDING_LANGUAGES.length / 2);
const ROWS = [LANDING_LANGUAGES.slice(0, HALF), LANDING_LANGUAGES.slice(HALF)] as const;

function Chip({ language }: { language: Language }) {
  return (
    <li className="mr-3 flex h-10 shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm whitespace-nowrap text-ink shadow-panel transition-ui hover:-translate-y-0.5 hover:border-line-hover motion-reduce:hover:translate-y-0">
      <span aria-hidden className="font-mono text-xs text-accent">
        .{language.extension}
      </span>
      {language.label}
    </li>
  );
}

/**
 * Two rows of language chips drifting in opposite directions. Scrolling speeds them up and skews
 * them a little; they settle back when scrolling stops. Paused on hover, keyboard focus, with the
 * pause button (WCAG 2.2.2) and whenever off-screen. With reduced motion: one still, wrapped list.
 */
export default function LanguageMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section
      id="languages"
      aria-labelledby="languages-title"
      className="scroll-mt-16 overflow-x-clip border-y border-line bg-surface/40 section-y"
    >
      <div className="px-4">
        <SectionHeading id="languages" eyebrow="languages" title="Fluent in your stack">
          From <Code>useEffect</Code> to <Code>impl Drop</Code>. Pick one language, or mix all{' '}
          {LANGUAGE_COUNT}.
        </SectionHeading>
      </div>

      <div className="mt-12 flex flex-col gap-3">
        {ROWS.map((row, i) => (
          <Marquee
            key={i}
            direction={i === 0 ? 1 : -1}
            speed={i === 0 ? 36 : 30}
            paused={paused}
            className="fade-x py-1"
            // Reduced motion: one still, wrapped list of every language instead of two rows
            fallback={
              i === 0 ? (
                <ul aria-label="Supported languages" className="flex flex-wrap justify-center gap-y-3 px-4">
                  {LANDING_LANGUAGES.map((language) => (
                    <Chip key={language.id} language={language} />
                  ))}
                </ul>
              ) : null
            }
          >
            <ul aria-label={`Supported languages, ${i + 1} of 2`} className="flex">
              {row.map((language) => (
                <Chip key={language.id} language={language} />
              ))}
            </ul>
          </Marquee>
        ))}
      </div>

      <div className="mt-6 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? 'Play language scroll' : 'Pause language scroll'}
          className={ICON_BUTTON}
        >
          {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
        </button>
      </div>
    </section>
  );
}
