import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

import './globals.css';
import Header from '@/components/layout/Header';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

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
      <body className={`${GeistSans.className} antialiased bg-white dark:bg-black`}>
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
