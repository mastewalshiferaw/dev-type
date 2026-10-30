import type { Metadata, Viewport } from 'next';
import { Fira_Code, Geist_Mono, JetBrains_Mono } from 'next/font/google';
import ThemeSync from '@/components/layout/ThemeSync';
import { SITE } from '@/lib/site';
import { SPLASH_INIT_SCRIPT } from '@/lib/splash-script';
import { THEME_INIT_SCRIPT } from '@/lib/theme-script';
import './globals.css';

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'], display: 'swap' });
// Optional code fonts: only downloaded when selected in settings
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  preload: false,
});
const firaCode = Fira_Code({ variable: '--font-fira-code', subsets: ['latin'], preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.title, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ['typing test', 'typing speed', 'wpm', 'code typing', 'programming', 'developer'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f6f1' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // data-theme is set by the inline script before paint, so React must not fight over it
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistMono.variable} ${jetbrainsMono.variable} ${firaCode.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
