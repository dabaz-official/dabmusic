import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';

import './globals.css';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: "DabMusic",
  description: "I AM MUSIC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased bg-white`}>
        <Header />
        <main className="my-24">
          {children}
        </main>
      </body>
    </html>
  );
}
