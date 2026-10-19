import type { Metadata } from 'next';
import localFont from 'next/font/local';

import './globals.css';
import Header from '@/components/layout/Header';
import { PlayerProvider } from '@/contexts/PlayerContext';
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
  }
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
      </body>
    </html>
  );
}
