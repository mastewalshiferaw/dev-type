import type { Metadata } from 'next';

const resolvedUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null) ||
  (process.env.NODE_ENV === 'production' ? 'https://dev-type-vert.vercel.app' : 'http://localhost:3000');

export const SITE = {
  name: 'DEV_TYPE',
  title: 'DEV_TYPE: typing speed test for developers',
  description:
    'A typing test for people who type code, not prose. Practice real snippets in 15 languages, track WPM, accuracy and consistency, and climb the daily leaderboard.',
  url: resolvedUrl,
  repo: 'https://github.com/mastewalshiferaw/dev-type',
  author: { name: 'mustCode', url: 'https://t.me/must_Code' },
};

/** Per-page title, description, canonical URL, Open Graph and Twitter card in one place. */
export function pageMetadata({
  title,
  description = SITE.description,
  path,
  image: customImage,
}: {
  /** Omit for the home page, which uses the full site title */
  title?: string;
  description?: string;
  path: string;
  /** Preview image path (1200×630); defaults to app/opengraph-image.tsx */
  image?: { url: string; alt: string };
}): Metadata {
  const fullTitle = title ? `${title} · ${SITE.name}` : SITE.title;
  // A page's openGraph replaces its parent's, which would drop the image from app/opengraph-image.tsx
  const image = { url: '/opengraph-image', alt: SITE.title, ...customImage, width: 1200, height: 630 };
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
