import LandingFooter from '@/components/landing/footer/LandingFooter';
import LandingShell from '@/components/landing/LandingShell';
import { geistSans } from '@/lib/fonts';

/** Home and legal pages: navbar, footer and the sans body font. The typing app (/play) has its own chrome. */
export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className={`${geistSans.variable} flex min-h-dvh flex-col`}>
      <LandingShell>
        {children}
        <LandingFooter />
      </LandingShell>
    </div>
  );
}
