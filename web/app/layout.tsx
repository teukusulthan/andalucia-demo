import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { SessionProvider } from "@/components/site/session";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

/* The brief names Playfair Display, and asks for a luxury-editorial tone. It carries the
   headline voice — hero h1, section h2, cabin titles, the specification caption — against Geist
   for everything a reader actually reads at length. Serif display over sans body is the whole
   tonal move; using it for body copy as well would undo it. */
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Andalucía Phinisi Charters",
    template: "%s · Andalucía Phinisi Charters",
  },
  description:
    "Charter a whole phinisi through the Komodo archipelago, or join a scheduled departure. Handcrafted vessel, crew of eight, Labuan Bajo.",
  openGraph: {
    type: "website",
    siteName: "Andalucía Phinisi Charters",
    locale: "en",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        {/* AAA 2.4.1 bypass block */}
        <a
          href="#main"
          className="vh focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:inline-flex focus:h-11 focus:w-auto focus:items-center focus:bg-foreground focus:px-5 focus:text-background focus:underline focus:[clip-path:none]"
        >
          Skip to main content
        </a>
        <SessionProvider>
          <SiteHeader floating />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
