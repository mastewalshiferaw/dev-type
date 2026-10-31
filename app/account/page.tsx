import { Suspense } from 'react';
import type { Metadata } from 'next';
import AccountView from '@/components/account/AccountView';
import Skeleton from '@/components/ui/Skeleton';
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
    <main className="flex-1 bg-canvas py-8">
      <Suspense fallback={<AccountFallback />}>
        <AccountView />
      </Suspense>
    </main>
  );
}
