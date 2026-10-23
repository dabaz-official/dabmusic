import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import './globals.css';
import Header from '@/components/layout/Header';
import { PlayerProvider } from '@/contexts/PlayerContext';
import ServiceWorkerRegistrar from '@/components/providers/ServiceWorkerRegistrar';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

// Latin subset; CJK and other scripts fall back to the system stack in globals.css.
const inter = localFont({
  src: './fonts/InterVariable.woff2',
  variable: '--font-inter',
  display: 'swap',
  weight: '100 900',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://music.dabaz.me'),
  applicationName: 'DabMusic',
  alternates: {
    canonical: '/',
  },
  title: {
    default: "DabMusic",
    template: "%s | DabMusic",
  },
  description: "I AM MUSIC.",
  openGraph: {
    title: "DabMusic",
    description: "I AM MUSIC.",
  },
  appleWebApp: {
    capable: true,
    title: 'DabMusic',
    statusBarStyle: 'default',
  },
  // iOS still reads this legacy flag when the manifest display mode is ignored.
  other: {
    'apple-mobile-web-app-capable': 'yes',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Let the installed app paint edge to edge; components inset themselves with
  // env(safe-area-inset-*).
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-white dark:bg-black`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <PlayerProvider>
            <Header />
            <main className="my-24">
              {children}
            </main>
          </PlayerProvider>
        </ThemeProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
