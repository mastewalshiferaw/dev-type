'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Logo from '@/components/layout/Logo';
import PaletteButton from '@/components/layout/PaletteButton';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { ButtonLink, ICON_BUTTON } from '@/components/ui/Button';
import { SECTION_LINKS } from '@/data/landing/navigation';
import { SPRING } from '@/lib/motion';

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
};

/** True once the page has scrolled 8px (false on the server). */
function useScrolled() {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 8,
    () => false
  );
}

const SPY_IDS = SECTION_LINKS.map((link) => link.href.split('#')[1]);

/**
 * Scroll-spy: the home-page section under a line 35% down the viewport, if it has a nav link.
 * Sections without one (results, testimonials…) clear the highlight.
 */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      const current = [...document.querySelectorAll<HTMLElement>('main section[id]')].find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= line && rect.bottom > line;
      });
      setActive(current && SPY_IDS.includes(current.id) ? current.id : null);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled]);
  return enabled ? active : null;
}

const NAV_LINK = 'relative rounded-sm px-3 py-2 text-sm transition-ui hover:text-ink active:translate-y-px';

export default function LandingNav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const scrolled = useScrolled();
  const active = useActiveSection(usePathname() === '/');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // A fixed 64px box in the flow; the bar inside shrinks with transforms only, so nothing shifts
    <header className="sticky top-0 z-40 h-16">
      <div
        aria-hidden
        className={`absolute inset-x-0 top-0 h-14 border-b border-line bg-canvas/75 backdrop-blur-md transition-opacity duration-(--duration-base) ease-out ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative page-container flex h-16 items-center justify-between gap-4 transition-transform duration-(--duration-base) ease-out ${
          scrolled ? '-translate-y-1' : ''
        }`}
      >
        <span data-nav-logo className="flex">
          <Logo />
        </span>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {SECTION_LINKS.map((link) => {
              const current = active === link.href.split('#')[1];
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'location' : undefined}
                    className={`${NAV_LINK} ${current ? 'text-ink' : 'text-muted'}`}
                  >
                    {current && (
                      <motion.span
                        layoutId="nav-active"
                        transition={SPRING}
                        className="absolute inset-0 -z-10 rounded-sm border border-line bg-raised"
                      />
                    )}
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <PaletteButton onClick={onOpenPalette} />
          <ThemeToggle />
          {/* A wrapper hides it: the button sets its own display */}
          <span className="ml-2 hidden sm:block">
            <ButtonLink href="/play" size="sm">
              Start typing
              <ArrowRight size={14} aria-hidden />
            </ButtonLink>
          </span>

          {/* Mobile menu: a modal sheet (focus trap, Escape, scroll lock and focus return via Radix) */}
          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger className={`${ICON_BUTTON} lg:hidden`} aria-label="Menu">
              <Menu size={18} aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-backdrop backdrop-blur-sm lg:hidden" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-x-0 top-0 z-50 animate-sheet-in border-b border-line bg-canvas shadow-modal lg:hidden"
              >
                <div className="page-container flex h-16 items-center justify-between">
                  <Dialog.Title className="label text-muted">Menu</Dialog.Title>
                  <Dialog.Close className={ICON_BUTTON} aria-label="Close menu">
                    <X size={18} aria-hidden />
                  </Dialog.Close>
                </div>
                <nav aria-label="Main" className="page-container pb-6">
                  <ul className="flex flex-col">
                    {SECTION_LINKS.map((link) => (
                      <li key={link.href} className="border-b border-line">
                        <Dialog.Close asChild>
                          <Link
                            href={link.href}
                            className="flex h-12 items-center justify-between rounded-sm text-base text-ink-dim transition-ui hover:text-ink active:text-accent"
                          >
                            {link.label}
                            <ArrowRight size={16} aria-hidden className="text-muted" />
                          </Link>
                        </Dialog.Close>
                      </li>
                    ))}
                  </ul>
                  <Dialog.Close asChild>
                    <ButtonLink href="/play" size="lg" className="mt-6 w-full">
                      Start typing
                      <ArrowRight size={16} aria-hidden />
                    </ButtonLink>
                  </Dialog.Close>
                </nav>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
