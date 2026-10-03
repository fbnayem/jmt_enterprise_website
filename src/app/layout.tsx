import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileActionBar } from "@/components/MobileActionBar";
import { StagingBanner } from "@/components/StagingBanner";
import { business } from "@/content/site";
import { isProductionSite, siteUrl } from "@/lib/site-env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `Pickup and Delivery Services | ${business.shortName}`, template: `%s | ${business.shortName}` },
  description:
    "JMT Enterprise picks up and delivers Marketplace purchases, furniture, appliances, oversized and fragile items for individuals and businesses. Request a quote.",
  applicationName: business.name,
  openGraph: { type: "website", siteName: business.name, locale: "en_US" },
  // Staging previews must never be indexed.
  robots: isProductionSite ? undefined : { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#102f52", width: "device-width", initialScale: 1 };

const ga4 = process.env.NEXT_PUBLIC_GA4_ID;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: business.name,
  url: business.url,
  telephone: business.phoneE164,
  email: business.email,
  description: "Pickup and delivery of everyday and oversized items for individuals and businesses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StagingBanner />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <MobileActionBar />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {ga4 && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
