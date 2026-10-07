import { ArrowRight, Check, Phone, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RouteIllustration } from "@/components/RouteIllustration";
import { CtaBand, FaqList, GlowBackdrop, HowItWorks, ItemMarquee, SectionHeading, ServiceGrid, VehicleOptions, WhoWeHelp } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business, faqs, reasons } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: `Pickup and Delivery for Everyday and Oversized Items | ${business.shortName}` },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950 text-white">
        <GlowBackdrop />
        <div className="container-page grid gap-12 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-28 lg:pt-24">
          <div>
            <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-accent-400" />
              </span>
              For individuals and businesses
            </p>
            <h1 className="mt-6 animate-fade-up text-4xl font-extrabold leading-[1.05] tracking-tight text-balance [animation-delay:80ms] sm:text-6xl">
              Pickup and Delivery for <span className="text-gradient">Everyday and Oversized</span> Items
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg text-brand-100/90 [animation-delay:160ms]">
              From Marketplace purchases and furniture to business deliveries, JMT Enterprise helps individuals and businesses move items
              with vehicle options to suit the job. Tell us what you need moved and request a quote.
            </p>
            <div className="mt-9 flex animate-fade-up flex-col gap-3 [animation-delay:240ms] sm:flex-row">
              <TrackedLink kind="quote" location="hero" href="/request-a-quote" className="btn-primary group text-lg">
                Request a Quote
                <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </TrackedLink>
              <TrackedLink kind="phone" location="hero" href={business.phoneHref} className="btn-on-dark text-lg">
                <Phone className="size-5" aria-hidden="true" /> Call {business.phoneDisplay}
              </TrackedLink>
            </div>
            <p className="mt-6 flex animate-fade-up items-start gap-2 text-sm text-brand-200 [animation-delay:320ms]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent-400" aria-hidden="true" />
              JMT reviews every request and confirms the price and service with you before anything is booked.
            </p>
          </div>
          <div className="animate-fade-up [animation-delay:200ms]">
            <RouteIllustration />
          </div>
        </div>
      </section>

      <ItemMarquee />

      <section className="py-14 sm:py-24" aria-labelledby="services-h">
        <div className="container-page">
          <SectionHeading eyebrow="Services" id="services-h" title="What we pick up and deliver" intro="A sofa from a Marketplace seller, a new appliance, an antique or a store delivery. Tell us what it is and where it is going." />
          <ServiceGrid />
        </div>
      </section>

      <section className="bg-dots bg-slate-50 py-14 sm:py-24" aria-labelledby="who-h">
        <div className="container-page">
          <SectionHeading eyebrow="Who we help" id="who-h" title="Built for households and businesses" intro="Households and businesses use the same simple request form." />
          <WhoWeHelp />
        </div>
      </section>

      <section className="py-14 sm:py-24" aria-labelledby="how-h">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" id="how-h" title="From request to pickup in four steps" intro="Send the details once and JMT comes back to you with a quote." />
          <HowItWorks />
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-brand-950 py-20 text-white sm:py-24" aria-labelledby="vehicles-h">
        <GlowBackdrop />
        <div className="container-page relative">
          <div className="max-w-2xl" data-reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">Vehicle options</p>
            <h2 id="vehicles-h" className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              The right space for <span className="text-gradient">every job</span>
            </h2>
            <p className="mt-4 text-lg text-brand-100/90">Four vehicle types, so the job gets the space it needs.</p>
          </div>
          <VehicleOptions />
        </div>
      </section>

      <section className="py-14 sm:py-24" aria-labelledby="area-h">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Service area" id="area-h" title="Where we work" />
            <div className="mt-6" data-reveal>
              <p className="text-lg text-muted">
                {business.serviceArea
                  ? business.serviceArea.summary
                  : "Tell us where the pickup and drop-off are. JMT checks every request against its service area and confirms coverage when it sends your quote."}
              </p>
              {business.serviceArea?.regions.map((region) => (
                <div key={region.name} className="mt-6">
                  <h3 className="font-bold text-brand-900">{region.name}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {region.places.map((p) => (
                      <li key={p} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-900">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="mt-5 text-muted">
                Not sure if we cover your location? Call{" "}
                <TrackedLink kind="phone" location="area" href={business.phoneHref} className="font-semibold text-brand-600 underline decoration-brand-200 underline-offset-4 transition-colors hover:decoration-brand-600">
                  {business.phoneDisplay}
                </TrackedLink>{" "}
                or send a request and JMT will let you know.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl" data-reveal>
              Why choose JMT
            </h2>
            <ul className="mt-8 space-y-4">
              {reasons.map((r, i) => (
                <li key={r.title} data-reveal style={{ "--d": i } as React.CSSProperties} className="group card card-hover flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
                    <Check className="size-5" strokeWidth={3} />
                  </span>
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

      <section className="bg-slate-50 py-14 sm:py-24" aria-labelledby="faq-h">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow="FAQ" id="faq-h" title="Common questions" center />
          <FaqList items={faqs.slice(0, 4)} />
          <div className="mt-8 text-center">
            <Link href="/faqs" className="btn-secondary group">
              See all FAQs <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand location="home_bottom" />
    </>
  );
}
