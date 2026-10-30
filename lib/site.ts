import type { Metadata } from 'next';

export const SITE = {
  name: 'DEV_TYPE',
  title: 'DEV_TYPE: typing speed test for developers',
  description:
    'A typing test for people who type code, not prose. Practice real snippets in 15 languages, track WPM, accuracy and consistency, and climb the daily leaderboard.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  repo: 'https://github.com/mastewalshiferaw/dev-type',
  author: { name: 'Bira Girma', url: 'https://github.com/Birabg' },
};

/** Per-page title, description, canonical URL, Open Graph and Twitter card in one place. */
export function pageMetadata({
  title,
  description = SITE.description,
  path,
}: {
  /** Omit for the home page, which uses the full site title */
  title?: string;
  description?: string;
  path: string;
}): Metadata {
  const fullTitle = title ? `${title} · ${SITE.name}` : SITE.title;
  // A page's openGraph replaces its parent's, which would drop the image from app/opengraph-image.tsx
  const image = { url: '/opengraph-image', width: 1200, height: 630, alt: SITE.title };
  return {
    title: title ?? { absolute: SITE.title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [image] },
  };
}
