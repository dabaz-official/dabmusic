import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

// Latin subset only; globals.css supplies the system stack for CJK.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://music.dabaz.me"),
  title: {
    default: "DabMusic",
    template: "%s | DabMusic",
  },
  description: "I AM MUSIC.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
