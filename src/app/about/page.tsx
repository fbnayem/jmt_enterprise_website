import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { CtaBand, PageHero } from "@/components/sections";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "About Us",
  description: `About ${business.name}, a pickup and delivery service for individuals and businesses across Denver Metro, Boulder and Northern Colorado.`,
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
        <div className="container-page grid max-w-5xl items-start gap-12 lg:grid-cols-[1fr_18rem]">
          <div className="prose-page">
            <h2>Who we are</h2>
            <p>
              {business.name} is a pickup and delivery company serving Denver Metro, Boulder and Northern Colorado. We move the
              things people and businesses need moved: a sofa bought from a Marketplace seller, a new appliance, an antique cabinet,
              a few pieces going to a new home, or an order going out to a customer.
            </p>
            <h2>How we work</h2>
            <p>
              Every job starts with a request. You tell us what needs moving, where it is and where it is going. JMT reviews the
              details, contacts you with a quote and availability, and confirms the service with you before anything is booked.
            </p>
            <p>
              We offer four vehicle types (car, pickup truck, cargo van and box truck) so each job can be matched to the space it
              needs. If you are not sure which one fits, choose Not sure and we will recommend one.
            </p>
            <h2>What you can expect</h2>
            <p>
              A clear quote before anything is booked, one request form for single items or several items and stops, and a direct
              line to JMT at <a href={business.phoneHref}>{business.phoneDisplay}</a> or{" "}
              <a href={business.emailHref}>{business.email}</a> if you have a question.
            </p>
          </div>
          <div data-reveal className="card p-8 lg:sticky lg:top-28">
            <Logo className="mx-auto h-auto w-full max-w-56" />
            <p className="mt-6 text-center text-sm text-muted">Pickup and delivery for individuals and businesses.</p>
          </div>
        </div>
      </section>
      <CtaBand location="about_bottom" />
    </>
  );
}
