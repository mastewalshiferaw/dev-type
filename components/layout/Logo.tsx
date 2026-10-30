import { Terminal } from 'lucide-react';
import Link from 'next/link';

/** `>_ DEV_TYPE`, linking home. Shared by the app header and the landing page. */
export default function Logo() {
  return (
    <Link
      href="/"
      aria-label="DEV_TYPE home"
      className="flex min-h-11 items-center gap-2 rounded-sm text-sm font-bold tracking-wider text-ink-dim transition-ui hover:text-ink"
    >
      <Terminal className="text-accent" size={20} aria-hidden />
      DEV_TYPE
    </Link>
  );
}
