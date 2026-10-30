import LegalPage from '@/components/landing/LegalPage';
import { pageMetadata, SITE } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Terms',
  description: 'The ground rules for using DEV_TYPE and its leaderboard.',
  path: '/terms',
});

// PLACEHOLDER: plain-language starter terms, not legal advice. Have them reviewed before launch.
export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="30 October 2026">
      <p>DEV_TYPE is a free typing test. By using it you agree to these few ground rules.</p>
      <h2>Play fair</h2>
      <ul>
        <li>Type your scores yourself: no scripts, macros or automated input.</li>
        <li>Pick a username that is not offensive, misleading or someone else&apos;s.</li>
      </ul>
      <p>Scores or usernames that break these rules may be removed from the leaderboard without notice.</p>
      <h2>No warranty</h2>
      <p>
        The service is provided as is. It may change, reset the leaderboard, or be unavailable at times, and
        it comes with no guarantee of any kind.
      </p>
      <h2>Code snippets</h2>
      <p>
        Practice snippets are short examples written for typing practice. Custom text you paste stays in your
        browser and is never uploaded.
      </p>
      <h2>Contact</h2>
      <p>
        Questions or problems? Open an issue on <a href={`${SITE.repo}/issues`}>GitHub</a>.
      </p>
    </LegalPage>
  );
}
