import type { Metadata } from "next";
import { CtaBand, PageHero } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Service Areas",
  description: "Where JMT Enterprise provides pickup and delivery, and how to ask about a location that is not listed.",
  alternates: { canonical: "/service-areas" },
  // Kept out of search results until JMT confirms its service area.
  robots: business.serviceArea ? undefined : { index: false, follow: true },
};

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero eyebrow="Service areas" title="Where we pick up and deliver" />
      <section className="py-14">
        <div className="container-page max-w-3xl space-y-8">
          {business.serviceArea ? (
            <>
              <p className="text-lg text-muted">{business.serviceArea.summary}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {business.serviceArea.places.map((p) => (
                  <li key={p} className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 font-medium text-brand-900 transition-colors hover:border-brand-300">
                    {p}
                  </li>
                ))}
              </ul>
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
