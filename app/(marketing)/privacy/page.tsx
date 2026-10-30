import LegalPage from '@/components/landing/LegalPage';
import { pageMetadata, SITE } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Privacy',
  description: 'What DEV_TYPE stores, where it is stored, and what is shared when you submit a score.',
  path: '/privacy',
});

// PLACEHOLDER: an accurate description of how the app handles data today, not legal advice.
// Have it reviewed before launch, and update it if you add analytics, accounts or cookies.
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="30 October 2026">
      <p>
        DEV_TYPE has no accounts, no ads, no analytics and no cookies. Here is everything it keeps, and where.
      </p>
      <h2>Stored in your browser</h2>
      <ul>
        <li>Your settings and theme preference.</li>
        <li>Your last 20 runs and your personal bests.</li>
        <li>The username you choose for the leaderboard.</li>
      </ul>
      <p>
        This lives in your browser&apos;s local storage and never leaves your device unless you submit a
        score. Clearing your site data, or &ldquo;Clear history&rdquo; in your profile, removes it.
      </p>
      <h2>Shared when you submit a score</h2>
      <p>
        Submitting a timed run sends your username, WPM, accuracy, language, mode and the time of the run to
        the leaderboard, where anyone can see them. Don&apos;t use your real name as a username unless you are
        happy for it to be public.
      </p>
      <h2>Hosting</h2>
      <p>
        Fonts are served from this site, not from a third party. The hosting provider may keep standard
        request logs (such as IP addresses) to run and protect the service.
      </p>
      <h2>Questions</h2>
      <p>
        Open an issue on <a href={`${SITE.repo}/issues`}>GitHub</a>.
      </p>
    </LegalPage>
  );
}
