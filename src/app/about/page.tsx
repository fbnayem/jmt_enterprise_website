import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { CtaBand, PageHero } from "@/components/sections";
import { business, pendingContent } from "@/content/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${business.name}, a pickup and delivery service for individuals and businesses.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title={`About ${business.name}`}>
        JMT Enterprise picks up and delivers items for individuals and businesses, from Marketplace purchases and furniture to
        oversized, fragile and business deliveries.
      </PageHero>
      <section className="py-14">
        <div className="container-page prose-page max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold text-brand-900">How we work</h2>
          <p>
            Every job starts with a request. You tell us what needs moving, where it is and where it is going. JMT reviews the details,
            contacts you with a quote and availability, and confirms the service with you before anything is booked.
          </p>
          <p>
            We offer four vehicle types (car, pickup truck, cargo van and box truck) so each job can be matched to the space it needs.
          </p>
          {pendingContent.aboutStory && (
            <div className="mt-8">
              <Placeholder title="Company story, team and operating approach">
                Add JMT&apos;s approved story: who runs the business, how it started and how the team works. Do not add years in
                business, licensing, insurance or fleet claims unless JMT confirms them.
              </Placeholder>
            </div>
          )}
        </div>
      </section>
      <CtaBand location="about_bottom" />
    </>
  );
}
