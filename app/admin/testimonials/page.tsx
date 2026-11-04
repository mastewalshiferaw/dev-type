import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AdminTestimonialsView from '@/components/admin/AdminTestimonialsView';
import Skeleton from '@/components/ui/Skeleton';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Footer from '@/components/layout/Footer';
import { pageMetadata } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Testimonial Moderation | Admin',
  description: 'Moderate, review, and approve user testimonials before publishing to the homepage.',
  path: '/admin/testimonials',
});

function AdminFallback() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  );
}

export default function AdminTestimonialsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/account"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-xs font-medium text-ink transition-ui hover:bg-raised"
            >
              <ArrowLeft size={14} aria-hidden />
              <span>Back to Account</span>
            </Link>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <Suspense fallback={<AdminFallback />}>
          <AdminTestimonialsView />
        </Suspense>
      </main>

      <div className="mx-auto w-full max-w-5xl px-4 pb-6 sm:px-6">
        <Footer />
      </div>
    </div>
  );
}
