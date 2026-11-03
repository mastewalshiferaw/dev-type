import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Skeleton from '@/components/ui/Skeleton';
import { CARD_SIZE, cardHeadline, cardImagePath, parseShareParams, sharePagePath } from '@/lib/share';
import { pageMetadata } from '@/lib/site';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const card = parseShareParams(await searchParams);
  if (!card) {
    return { ...pageMetadata({ title: 'Shared result', path: '/share' }), robots: { index: false } };
  }
  const headline = cardHeadline(card);
  return {
    ...pageMetadata({
      title: `${card.wpm} WPM personal best`,
      description: `${headline}. Think you can type code faster?`,
      path: sharePagePath(card),
      image: { url: cardImagePath(card), alt: headline },
    }),
    // Every link is a different URL; keep them out of search results
    robots: { index: false, follow: true },
  };
}

async function SharedCard({ searchParams }: { searchParams: SearchParams }) {
  const card = parseShareParams(await searchParams);

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-bold text-ink">This share link is broken</h1>
        <p className="text-sm text-muted">The result could not be read. Set your own score instead.</p>
        <PlayLink label="Take the test" />
      </div>
    );
  }

  const headline = cardHeadline(card);
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not an optimisable asset */}
      <img
        src={cardImagePath(card)}
        alt={headline}
        width={CARD_SIZE.width}
        height={CARD_SIZE.height}
        className="h-auto w-full rounded-xl border border-line shadow-panel"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-balance text-ink sm:text-2xl">
          {card.username ? `@${card.username}` : 'Someone'} typed {card.wpm} WPM of code
        </h1>
        <p className="text-sm text-muted">
          Real snippets, 15 languages, no autocomplete. Think you are faster?
        </p>
      </div>
      <PlayLink label="Beat this score" />
    </div>
  );
}

function PlayLink({ label }: { label: string }) {
  return (
    <Link
      href="/play"
      className="inline-flex h-11 items-center gap-2 rounded-md bg-accent-fill px-5 text-sm font-bold text-accent-ink transition-ui hover:bg-accent-fill-hover"
    >
      {label}
      <ArrowRight size={16} aria-hidden />
    </Link>
  );
}

export default function SharePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10 sm:px-6">
        <Suspense fallback={<Skeleton className="aspect-[1200/630] w-full rounded-xl" />}>
          <SharedCard searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
