import type { Metadata, Viewport } from "next";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileActionBar } from "@/components/MobileActionBar";
import { RevealObserver } from "@/components/RevealObserver";
import { business } from "@/content/site";
import { isProductionSite, siteUrl } from "@/lib/site-env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `Pickup and Delivery Services | ${business.shortName}`, template: `%s | ${business.shortName}` },
  description:
    "JMT Enterprise picks up and delivers Marketplace purchases, furniture, appliances, oversized and fragile items across Denver Metro, Boulder and Northern Colorado. Request a quote.",
  applicationName: business.name,
  openGraph: { type: "website", siteName: business.name, locale: "en_US" },
  // Staging previews must never be indexed.
  robots: isProductionSite ? undefined : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#0c2650", width: "device-width", initialScale: 1, viewportFit: "cover" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: business.name,
  url: business.url,
  telephone: business.phoneE164,
  email: business.email,
  logo: `${business.url}/brand/jmt-logo.png`,
  description: "Pickup and delivery of everyday and oversized items for individuals and businesses.",
  ...(business.serviceArea && {
    areaServed: business.serviceArea.regions.flatMap((r) =>
      r.places.map((name) => ({ "@type": "City", name, containedInPlace: { "@type": "State", name: "Colorado" } })),
    ),
  }),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Marks JS as available so scroll-reveal styles apply; without JS everything stays visible. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileActionBar />
        <RevealObserver />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Analytics />
      </body>
    </html>
  );
}
