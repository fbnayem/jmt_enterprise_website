import type { Metadata } from "next";
import { AnalyticsOptOut } from "@/components/AnalyticsOptOut";
import { PageHero } from "@/components/sections";
import { business, pendingContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${business.name} collects and uses the information in quote requests.`,
  alternates: { canonical: "/privacy-policy" },
  robots: pendingContent.privacyPolicy ? { index: false, follow: true } : undefined,
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Policy" title="Privacy Policy" />
      <section className="py-14">
        <div className="container-page prose-page max-w-3xl">
          <p>
            This page explains what {business.name} does with the information you send through this website. If you have a
            question about your information, or would like it corrected or deleted, email{" "}
            <a href={business.emailHref}>{business.email}</a> or call <a href={business.phoneHref}>{business.phoneDisplay}</a>.
          </p>
          <h2>What we collect</h2>
          <p>
            When you request a quote we collect your name, phone number, email address, pickup and drop-off addresses, item details
            and any item photos you choose to add. We use this information to review your request, prepare a quote and contact you
            about the service.
          </p>
          <h2>How it is stored</h2>
          <p>
            Requests are kept in a private database and photos in private storage. Our staff open photos through links that expire.
            Location details embedded in photos are removed when they are uploaded.
          </p>
          <h2>Emails</h2>
          <p>
            Your request is emailed to JMT so we can review it, and you receive a confirmation email that we have it. These emails
            are sent through an email delivery provider.
          </p>
          <h2>Analytics</h2>
          <p>
            If analytics are switched on, they count page visits and form steps only. Your name, contact details, addresses, photos
            and messages are never sent to analytics, and advertising features are off.
          </p>
          {process.env.NEXT_PUBLIC_GA4_ID && (
            <section aria-labelledby="analytics-h" className="mt-10">
              <h2 id="analytics-h" className="text-xl font-extrabold text-brand-900">Analytics on this device</h2>
              <AnalyticsOptOut />
            </section>
          )}
        </div>
      </section>
    </>
  );
}
