import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
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
          {pendingContent.privacyPolicy ? (
            <Placeholder title="Client-approved privacy policy wording">
              <p className="mb-2">Staging draft. Publish only JMT-approved wording. The policy must accurately cover what this site does:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Collects name, phone, email, pickup/drop-off addresses, item details and optional item photos to prepare a quote.</li>
                <li>Stores requests in a private database and photos in private storage; staff access photos through expiring links.</li>
                <li>Emails the request to {business.email} and sends the customer a receipt through an email provider.</li>
                <li>Removes location metadata from photos.</li>
                <li>Uses analytics (if enabled) for page visits and form steps only, without personal details.</li>
                <li>Retention periods and deletion requests: to be decided by JMT.</li>
              </ul>
            </Placeholder>
          ) : null}
        </div>
      </section>
    </>
  );
}
