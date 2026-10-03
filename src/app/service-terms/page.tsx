import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
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
          {pendingContent.serviceTerms && (
            <Placeholder title="Client-approved service terms">
              <p className="mb-2">Staging draft. Publish only JMT-approved terms covering:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>How quotes are issued and when a service counts as confirmed.</li>
                <li>Cancellation and rescheduling rules.</li>
                <li>Prohibited or restricted items.</li>
                <li>Loading help, stairs and specialty handling rules.</li>
                <li>Liability for loss or damage.</li>
              </ul>
            </Placeholder>
          )}
        </div>
      </section>
    </>
  );
}
