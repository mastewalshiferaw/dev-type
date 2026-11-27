import { Suspense } from 'react';
import DuelView from '@/components/duel/DuelView';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: '1v1 Commit Duel · Multiplayer Code Race',
  description:
    'Commit and race head-to-head in real time against another developer on the same code snippet.',
  path: '/duel',
});

export default function DuelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas font-mono text-sm text-ink">
          Loading 1v1 duel arena...
        </div>
      }
    >
      <DuelView />
    </Suspense>
  );
}
