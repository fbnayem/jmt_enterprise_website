/** /faqs (src/app/faqs/page.tsx). FAQPage JSON-LD comes from the Nested Accordion's FAQ Schema switch. */
import { faqs } from "../../../../src/content/site.ts";
import { ctaBand, faqAccordion, pageHero, section } from "../blocks.mjs";
import { width } from "../tokens.mjs";

export default {
  title: "FAQs",
  slug: "faqs",
  seo: {
    title: "Frequently Asked Questions | JMT Enterprise",
    description: "What JMT transports, choosing a vehicle, photos, stairs and loading help, pricing, scheduling and how confirmation works.",
  },
  content: () => [
    pageHero({ eyebrow: "FAQs", title: "Frequently asked questions" }),
    section({ y: [56, 56], inner: width["3xl"] }, [faqAccordion(faqs, { faqSchema: true, margin: [0, 0, 0, 0] })]),
    ctaBand({ title: "Still have a question?" }),
  ],
};
