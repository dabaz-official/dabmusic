import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/theme-provider";
import { PlayerProvider } from "@/components/player/player-provider";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import {
  PAGE_BACKGROUND,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

import "./globals.css";
// CJK font: Noto Sans SC variable (wght 100-900), 827 unicode-range
// @font-face rules; the woff2 chunks themselves are served from
// public/fonts/noto-sans-sc/ and load on demand.
import "./fonts/noto-sans-sc.css";

// Latin subset only; globals.css supplies the system stack for CJK.
const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Declaring `icons` replaces Next's icon file conventions, so both the
  // favicon and the touch icon are named here; the manifest is picked up from
  // `src/app/manifest.ts` on its own.
  icons: { icon: "/favicon.png", apple: "/apple-icon.png" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PAGE_BACKGROUND.light },
    { media: "(prefers-color-scheme: dark)", color: PAGE_BACKGROUND.dark },
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
          <PlayerProvider>{children}</PlayerProvider>
          <ServiceWorkerRegistrar />
        </ThemeProvider>
      </body>
    </html>
  );
}
