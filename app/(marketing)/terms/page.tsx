import LegalPage from '@/components/landing/LegalPage';
import { pageMetadata, SITE } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Terms',
  description: 'The ground rules for using DEV_TYPE and its leaderboard.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="2 November 2026">
      <p>
        Welcome to DEV_TYPE. By accessing or using our website and services, you agree to comply with and be bound by these Terms of Service.
      </p>

      <h2>1. Permitted Use &amp; Fair Play</h2>
      <ul>
        <li>You agree to type all runs manually without using automated bots, scripts, or simulated keystroke inputs.</li>
        <li>Leaderboard submissions must reflect authentic human typing.</li>
        <li>Usernames must not be abusive, impersonate others, violate trademarks, or contain unlawful content.</li>
      </ul>
      <p>
        We reserve the right to remove illegitimate scores or restrict accounts that engage in score spoofing, leaderboard spam, or abuse.
      </p>

      <h2>2. Custom Snippets &amp; Intellectual Property</h2>
      <p>
        The software snippets provided in the app are for educational and typing practice purposes. Any custom code or text you paste into the custom mode remains strictly within your browser&apos;s local storage and is never uploaded to our servers.
      </p>

      <h2>3. Disclaimer of Warranties</h2>
      <p>
        DEV_TYPE is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied. We do not guarantee uninterrupted availability, error-free operation, or permanent retention of leaderboard entries or practice history.
      </p>

      <h2>4. Changes to Service &amp; Terms</h2>
      <p>
        We may update features or revise these terms from time to time. Continued use of the service following modifications constitutes acceptance of the updated terms.
      </p>

      <h2>5. Contact Information</h2>
      <p>
        If you have questions regarding these terms, please contact us at{' '}
        <a href="mailto:mastewalgetu@gmail.com">mastewalgetu@gmail.com</a> or via our{' '}
        <a href={`${SITE.repo}/issues`}>GitHub Repository</a>.
      </p>
    </LegalPage>
  );
}
