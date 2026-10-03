import { Check, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { CtaBand, FaqList, HowItWorks, SectionHeading, ServiceGrid, VehicleOptions, WhoWeHelp } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business, faqs, reasons } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: `Pickup and Delivery for Everyday and Oversized Items | ${business.shortName}` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-accent-400">For individuals and businesses</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Pickup and Delivery for Everyday and Oversized Items
            </h1>
            <p className="mt-5 max-w-xl text-lg text-brand-100">
              From Marketplace purchases and furniture to business deliveries, JMT Enterprise helps individuals and businesses move
              items with vehicle options to suit the job. Tell us what you need moved and request a quote.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink kind="quote" location="hero" href="/request-a-quote" className="btn-primary text-lg">
                Request a Quote
              </TrackedLink>
              <TrackedLink kind="phone" location="hero" href={business.phoneHref} className="btn-on-dark text-lg">
                <Phone className="size-5" aria-hidden="true" /> Call {business.phoneDisplay}
              </TrackedLink>
            </div>
            <p className="mt-4 text-sm text-brand-200">JMT reviews every request and confirms the price and service with you before anything is booked.</p>
          </div>
          <div className="hidden lg:block">
            <Placeholder title="Hero photo: authentic JMT vehicle or a typical delivery">
              Use an approved photo of JMT&apos;s vehicles or the items it transports. Licensed stock can illustrate, without implying it
              shows JMT&apos;s team or fleet.
            </Placeholder>
          </div>
        </div>
      </section>

      <section className="py-16" aria-labelledby="services-h">
        <div className="container-page">
          <SectionHeading id="services-h" title="What we pick up and deliver" intro="A sofa from a Marketplace seller, a new appliance, an antique or a store delivery. Tell us what it is and where it is going." />
          <ServiceGrid />
        </div>
      </section>

      <section className="bg-slate-50 py-16" aria-labelledby="who-h">
        <div className="container-page">
          <SectionHeading id="who-h" title="Who we help" intro="Households and businesses use the same simple request form." />
          <WhoWeHelp />
        </div>
      </section>

      <section className="py-16" aria-labelledby="how-h">
        <div className="container-page">
          <SectionHeading id="how-h" title="How it works" intro="Nothing is booked until you and JMT agree the details." />
          <HowItWorks />
        </div>
      </section>

      <section className="bg-slate-50 py-16" aria-labelledby="vehicles-h">
        <div className="container-page">
          <SectionHeading id="vehicles-h" title="Vehicle options" intro="Four vehicle types, so the job gets the space it needs." />
          <VehicleOptions />
        </div>
      </section>

      <section className="py-16" aria-labelledby="area-h">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="area-h" title="Where we work" />
            <div className="mt-6">
              {business.serviceArea ? (
                <p className="text-lg text-muted">{business.serviceArea.summary}</p>
              ) : (
                <Placeholder title="Confirmed service area">
                  Add the cities, ZIP codes and region JMT confirms. Until then, visitors are invited to ask about their location.
                </Placeholder>
              )}
              <p className="mt-4 text-muted">
                Not sure if we cover your location? Call{" "}
                <TrackedLink kind="phone" location="area" href={business.phoneHref} className="font-semibold text-brand-700 underline">
                  {business.phoneDisplay}
                </TrackedLink>{" "}
                or send a request and JMT will let you know.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">Why choose JMT</h2>
            <ul className="mt-6 space-y-4">
              {reasons.map((r) => (
                <li key={r.title} className="flex gap-3">
                  <Check className="mt-1 size-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-brand-900">{r.title}</p>
                    <p className="text-muted">{r.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials are intentionally omitted until JMT supplies genuine customer reviews. */}

      <section className="bg-slate-50 py-16" aria-labelledby="faq-h">
        <div className="container-page max-w-3xl">
          <SectionHeading id="faq-h" title="Common questions" />
          <FaqList items={faqs.slice(0, 4)} />
          <a href="/faqs" className="mt-6 inline-block font-semibold text-brand-700 underline underline-offset-4">
            See all FAQs
          </a>
        </div>
      </section>

      <CtaBand location="home_bottom" />
    </>
  );
}
