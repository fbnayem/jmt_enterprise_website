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
          <h2>Who we share it with</h2>
          <p>
            We do not sell your information or share it for advertising. It is handled only by the service providers that run this
            website for us (hosting, the database and photo storage, and email delivery), and only so they can provide that service.
          </p>
          <h2>Analytics and cookies</h2>
          <p>
            If analytics are switched on, they count page visits and form steps only. Your name, contact details, addresses, photos
            and messages are never sent to analytics, and advertising features are off. Analytics use cookies to tell visits apart.
            The quote form saves your progress in your own browser so you can pick up where you left off.
          </p>
          <h2>Your choices</h2>
          <p>
            You can ask us what information we hold about you, or ask us to correct or delete it, by emailing{" "}
            <a href={business.emailHref}>{business.email}</a>. You do not need to send photos to request a quote.
          </p>
          <h2>Changes to this policy</h2>
          <p>If we change how we handle your information, we will update this page.</p>
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
