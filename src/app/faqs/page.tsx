import type { Metadata } from "next";
import { CtaBand, FaqList, PageHero } from "@/components/sections";
import { faqs } from "@/content/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "What JMT transports, choosing a vehicle, photos, stairs and loading help, pricing, scheduling and how confirmation works.",
  alternates: { canonical: "/faqs" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function FaqsPage() {
  return (
    <>
      <PageHero eyebrow="FAQs" title="Frequently asked questions" />
      <section className="py-14">
        <div className="container-page max-w-3xl">
          <FaqList />
        </div>
      </section>
      <CtaBand title="Still have a question?" location="faqs_bottom" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </>
  );
}
