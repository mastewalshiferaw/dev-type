import Faq from '@/components/landing/faq/Faq';
import Features from '@/components/landing/features/Features';
import FinalCta from '@/components/landing/cta/FinalCta';
import Hero from '@/components/landing/hero/Hero';
import HowItWorks from '@/components/landing/how-it-works/HowItWorks';
import LanguageMarquee from '@/components/landing/languages/LanguageMarquee';
import LeaderboardPreview from '@/components/landing/leaderboard/LeaderboardPreview';
import ResultsShowcase from '@/components/landing/results/ResultsShowcase';
import Splash from '@/components/splash/Splash';
import Testimonials from '@/components/landing/testimonials/Testimonials';
import { FAQ } from '@/data/landing/faq';
import { LANDING_LANGUAGES } from '@/data/landing/languages';
import { pageMetadata, SITE } from '@/lib/site';

export const metadata = pageMetadata({ path: '/' });

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        `Typing tests with real code in ${LANDING_LANGUAGES.map((language) => language.label).join(', ')}`,
        'Time, lines, zen and custom modes',
        'WPM, raw WPM, accuracy and consistency with a speed-over-time chart',
        'Daily, weekly and all-time leaderboards',
      ],
      author: { '@type': 'Person', name: SITE.author.name, url: SITE.author.url },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Client overlay on top of the server-rendered page; only shown on a session's first visit */}
      <Splash />
      <main id="main" className="flex-1">
        <script
          type="application/ld+json"
          // Escape `<` so the payload can never close the script tag
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <Hero />
        <LanguageMarquee />
        <Features />
        <HowItWorks />
        <LeaderboardPreview />
        <ResultsShowcase />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
    </>
  );
}
