import DevTypeApp from '@/components/DevTypeApp';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Typing test',
  description:
    'Type real code against the clock: 15 languages, time, lines, zen and custom modes, detailed stats and a live leaderboard.',
  path: '/play',
});

export default function PlayPage() {
  return <DevTypeApp />;
}
