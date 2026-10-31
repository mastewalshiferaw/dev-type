import { SITE } from '@/lib/site';

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

/** Home page sections. Absolute (`/#…`) so they also work from the legal pages. */
export const SECTION_LINKS: readonly NavLink[] = [
  { label: 'Features', href: '/#features' },
  { label: 'Languages', href: '/#languages' },
  { label: 'Leaderboard', href: '/#leaderboard' },
  { label: 'FAQ', href: '/#faq' },
];

export const FOOTER_COLUMNS: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Start typing', href: '/play' },
      { label: 'Account & Streaks', href: '/account' },
      { label: 'Live leaderboard', href: '/play#leaderboard' },
      { label: 'Features', href: '/#features' },
      { label: 'Languages', href: '/#languages' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'FAQ', href: '/#faq' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Source code', href: SITE.repo, external: true },
      { label: 'Report an issue', href: `${SITE.repo}/issues`, external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];
