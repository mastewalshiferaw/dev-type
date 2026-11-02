import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccountView from '@/components/account/AccountView';
import Skeleton from '@/components/ui/Skeleton';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Footer from '@/components/layout/Footer';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'User Account & Activity',
  description:
    'Track your coding streaks, GitHub-style daily practice contribution blocks, and programming language focus breakdown over time.',
  path: '/account',
});

function AccountFallback() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="rounded-2xl h-44" />
      <Skeleton className="rounded-2xl h-40" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#account-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent-fill focus:px-3 focus:py-2 focus:text-xs focus:font-bold focus:text-accent-ink focus:shadow-modal focus:outline-none"
      >
        Skip to main content
      </a>

      <header className="border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/play"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium text-ink transition-ui hover:bg-raised"
            >
              <ArrowLeft size={14} aria-hidden />
              <span>Back to test</span>
            </Link>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="account-content" className="flex-1 py-8">
        <Suspense fallback={<AccountFallback />}>
          <AccountView />
        </Suspense>
      </main>

      <div className="mx-auto w-full max-w-5xl px-4 pb-6 sm:px-6">
        <Footer />
      </div>
    </div>
  );
}
