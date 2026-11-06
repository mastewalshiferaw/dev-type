import LegalPage from '@/components/landing/LegalPage';
import { pageMetadata, SITE } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Privacy',
  description: 'What DEV_TYPE stores, where it is stored, and what is shared when you submit a score.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="2 November 2026">
      <p>
        DEV_TYPE is an open-source typing speed test tailored for software developers. This Privacy Policy
        describes how DEV_TYPE (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects your
        information when you use our website.
      </p>

      <h2>1. Information Stored Locally On Your Device</h2>
      <p>
        By default, DEV_TYPE stores your practice history and preferences locally in your browser&apos;s{' '}
        <code>localStorage</code>:
      </p>
      <ul>
        <li>Interface settings (theme, font, caret style, sound and syntax toggles).</li>
        <li>Your last 20 practice runs and personal bests per language and mode.</li>
        <li>Local practice activity logs used to compute streaks and heatmaps.</li>
        <li>Your chosen display nickname.</li>
      </ul>
      <p>
        You can clear this local data at any time by clearing your browser cache or using the &ldquo;Clear
        history&rdquo; button in your profile settings.
      </p>

      <h2>2. Optional User Accounts &amp; Authentication</h2>
      <p>You may practice without creating an account. If you choose to sign up or sign in:</p>
      <ul>
        <li>Authentication is powered by Supabase Auth (hosted in secure European/US cloud facilities).</li>
        <li>
          We collect your email address and an optional username to manage your account and authentication
          sessions.
        </li>
        <li>
          Authentication session tokens are securely stored in your browser&apos;s storage to keep you signed
          in.
        </li>
        <li>
          Your email address is strictly private and is never published or exposed on the public leaderboard.
        </li>
      </ul>

      <h2>3. Public Leaderboard Submissions</h2>
      <p>
        When you complete a ranked timed run and choose to submit your score (or when logged in), the
        following details are sent to our public scores database:
      </p>
      <ul>
        <li>Your public display username.</li>
        <li>Your speed (WPM), accuracy percentage, programming language, test mode, and timestamp.</li>
      </ul>
      <p>
        These leaderboard records are publicly viewable by visitors worldwide. Please do not use sensitive or
        personally identifiable information as your public username.
      </p>

      <h2>4. Data Retention and Account Deletion</h2>
      <p>
        You retain full control over your personal data. You may request full deletion of your registered
        account and associated practice logs by contacting us or opening a request on our repository.
      </p>

      <h2>5. Hosting &amp; Infrastructure</h2>
      <p>
        Our front-end is hosted on Vercel, and our database infrastructure is hosted on Supabase. These
        infrastructure providers may process server access logs (such as IP addresses and browser user-agent
        headers) strictly for security, monitoring, and denial-of-service prevention.
      </p>

      <h2>6. Contact &amp; Controller</h2>
      <p>
        The data controller for DEV_TYPE is Mastewal Getu. If you have questions about this privacy notice or
        wish to exercise your data rights, please reach out via{' '}
        <a href="mailto:mastewalgetu@gmail.com">mastewalgetu@gmail.com</a> or open an issue on{' '}
        <a href={`${SITE.repo}/issues`}>GitHub</a>.
      </p>
    </LegalPage>
  );
}
