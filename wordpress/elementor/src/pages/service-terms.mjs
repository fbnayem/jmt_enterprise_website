/** /service-terms (src/app/service-terms/page.tsx). */
import { business, pendingContent } from "../../../../src/content/site.ts";
import { pageHero, section } from "../blocks.mjs";
import { container } from "../el.mjs";
import { width } from "../tokens.mjs";
import { prose } from "./privacy-policy.mjs";

const blocks = [
  [
    "Quotes and confirmation",
    `Sending a request through this website asks ${business.name} for a quote. It does not book a vehicle or reserve a time. JMT reviews each request, sets the price and contacts you. Your service is confirmed only when JMT confirms it with you.`,
  ],
  [
    "Requested dates",
    "A date or time you choose in the form is a preference. JMT confirms the actual date and time when it confirms the service.",
  ],
  [
    "Where we work",
    `JMT provides pickup and delivery in the cities listed on our <a href="/service-areas">Service Areas</a> page. If a pickup or drop-off is outside that area, JMT will tell you when it reviews your request.`,
  ],
  [
    "Item details",
    "Please describe your items accurately, including size, weight, stairs and access. The quote is based on the details you send, and JMT will contact you if anything needs to change.",
  ],
  [
    "Questions",
    `For questions about cancellations, rescheduling, items we can carry or anything else about your service, call <a href="${business.phoneHref}">${business.phoneDisplay}</a> or email <a href="${business.emailHref}">${business.email}</a> before your service is confirmed.`,
  ],
];

export default {
  title: "Service Terms",
  slug: "service-terms",
  seo: {
    title: "Service Terms | JMT Enterprise",
    description: `Service, cancellation, item restriction and liability terms for ${business.name}.`,
    noindex: pendingContent.serviceTerms,
  },
  content: () => [
    pageHero({ eyebrow: "Policy", title: "Service Terms" }),
    section({ y: [56, 56], inner: width["3xl"] }, [container({}, prose(blocks))]),
  ],
};
