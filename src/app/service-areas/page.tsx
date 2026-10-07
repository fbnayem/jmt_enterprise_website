import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Service Areas",
  description:
    "JMT Enterprise picks up and delivers across Denver Metro, Boulder and Northern Colorado, including Denver, Aurora, Lakewood, Boulder, Longmont, Fort Collins and Greeley.",
  alternates: { canonical: "/service-areas" },
};

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero eyebrow="Service areas" title="Where we pick up and deliver">
        Denver Metro, Boulder and Northern Colorado.
      </PageHero>
      <section className="py-14">
        <div className="container-page max-w-3xl space-y-8">
          {business.serviceArea ? (
            <>
              <p className="text-lg text-muted">{business.serviceArea.summary}</p>
              {business.serviceArea.regions.map((region) => (
                <div key={region.name} data-reveal>
                  <h2 className="text-xl font-bold text-brand-900">{region.name}</h2>
                  <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {region.places.map((p) => (
                      <li key={p} className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 font-medium text-brand-900 transition-colors hover:border-brand-300">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <p className="text-lg text-muted">
              JMT provides pickup and delivery within its service area. Every request is checked against our service area, and we confirm whether
              your pickup and drop-off locations are covered when we send your quote.
            </p>
          )}
          <div data-reveal className="card p-6">
            <h2 className="text-xl font-bold text-brand-900">Not sure if we cover your location?</h2>
            <p className="mt-2 text-muted">
              Call{" "}
              <TrackedLink kind="phone" location="service_areas" href={business.phoneHref} className="font-semibold text-brand-700 underline">
                {business.phoneDisplay}
              </TrackedLink>
              , email{" "}
              <TrackedLink kind="email" location="service_areas" href={business.emailHref} className="font-semibold text-brand-700 underline">
                {business.email}
              </TrackedLink>
              , or send a quote request with both addresses. JMT will review it and let you know.
            </p>
          </div>
        </div>
      </section>
      <CtaBand location="service_areas_bottom" />
    </>
  );
}
