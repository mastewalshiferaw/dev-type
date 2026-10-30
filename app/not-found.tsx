import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-6 text-left shadow-panel">
        <p className="text-xs text-muted">
          <span className="text-success">dev@type</span>:<span className="text-accent">~</span>$ cd{' '}
          <span className="text-ink">this-page</span>
        </p>
        <p className="mt-2 text-sm text-danger">bash: cd: this-page: No such file or directory</p>
        <p className="mt-4 text-5xl font-bold text-accent">404</p>
        <h1 className="mt-2 text-lg font-bold text-ink">Route not found</h1>
        <p className="mt-1 text-sm text-ink-dim">
          The page you are looking for was moved, deleted, or never compiled.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <ButtonLink href="/play">Back to the typing test</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </main>
  );
}
