import type { Metadata } from "next";
import { PageHero } from "@/components/sections";
import { business, pendingContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Service Terms",
  description: `Service, cancellation, item restriction and liability terms for ${business.name}.`,
  alternates: { canonical: "/service-terms" },
  robots: pendingContent.serviceTerms ? { index: false, follow: true } : undefined,
};

export default function ServiceTermsPage() {
  return (
    <>
      <PageHero eyebrow="Policy" title="Service Terms" />
      <section className="py-14">
        <div className="container-page prose-page max-w-3xl">
          <h2>Quotes and confirmation</h2>
          <p>
            Sending a request through this website asks {business.name} for a quote. It does not book a vehicle or reserve a time.
            JMT reviews each request, sets the price and contacts you. Your service is confirmed only when JMT confirms it with you.
          </p>
          <h2>Requested dates</h2>
          <p>A date or time you choose in the form is a preference. JMT confirms the actual date and time when it confirms the service.</p>
          <h2>Item details</h2>
          <p>
            Please describe your items accurately, including size, weight, stairs and access. The quote is based on the details you
            send, and JMT will contact you if anything needs to change.
          </p>
          <h2>Questions</h2>
          <p>
            For questions about cancellations, rescheduling, items we can carry or anything else about your service, call{" "}
            <a href={business.phoneHref}>{business.phoneDisplay}</a> or email <a href={business.emailHref}>{business.email}</a> before
            your service is confirmed.
          </p>
        </div>
      </section>
    </>
  );
}
