import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";
// CJK font: 827 unicode-range @font-face rules; the woff2 chunks themselves
// are served from public/fonts/puhuiti/ and load on demand.
import "./fonts/puhuiti.css";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class on <html>
    // before hydration and owns the no-flash inline script.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
