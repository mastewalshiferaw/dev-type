import Link from 'next/link';
import BackToTop from '@/components/landing/footer/BackToTop';
import FooterWordmark from '@/components/landing/footer/FooterWordmark';
import { CONTAINER } from '@/components/landing/Section';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { ICON_BUTTON } from '@/components/ui/Button';
import GitHubIcon from '@/components/ui/GitHubIcon';
import { FOOTER_COLUMNS } from '@/data/landing/navigation';
import { SITE } from '@/lib/site';

// 44px rows on touch screens, compact with a mouse
const LINK =
  'inline-flex min-h-11 items-center rounded-sm text-sm text-muted transition-ui hover:text-ink active:text-accent sm:min-h-0';

export default function LandingFooter() {
  return (
    <footer className="mt-auto overflow-x-clip border-t border-line bg-surface/40">
      <div className={`${CONTAINER} grid gap-12 py-16 sm:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr]`}>
        <div className="flex flex-col gap-4 sm:col-span-3 lg:col-span-1">
          <Logo />
          <p className="max-w-xs font-sans text-sm text-muted">
            The typing test for people who type code, not prose.
          </p>
          <div className="-ml-2 flex items-center gap-1">
            <a href={SITE.repo} aria-label="DEV_TYPE on GitHub" className={ICON_BUTTON}>
              <GitHubIcon />
            </a>
            <ThemeToggle />
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-4">
            <p className="label text-ink-dim">{column.title}</p>
            <ul className="flex flex-col gap-1 sm:gap-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} className={LINK}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div
          className={`${CONTAINER} flex flex-col gap-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>
            Built by{' '}
            <a
              href={SITE.author.url}
              className="rounded-sm font-semibold text-ink-dim underline decoration-line-strong underline-offset-4 transition-ui hover:text-accent hover:decoration-accent"
            >
              {SITE.author.name}
            </a>
            <span aria-hidden className="mx-2">
              ·
            </span>
            Free and open source. No account required.
          </p>
          <div className="-ml-3 sm:ml-0">
            <BackToTop />
          </div>
        </div>
      </div>

      <FooterWordmark />
    </footer>
  );
}
