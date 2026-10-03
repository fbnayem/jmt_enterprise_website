import { Check } from "lucide-react";
import type { Metadata } from "next";
import { CtaBand, HowItWorks, PageHero, SectionHeading, serviceIcons } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { services } from "@/content/site";

export const metadata: Metadata = {
  title: "Pickup and Delivery Services",
  description:
    "Marketplace pickups, furniture and appliance delivery, heavy and oversized items, fragile and antique pieces, home-to-home transport and small-business deliveries.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero eyebrow="Services" title="Pickup and delivery services">
        JMT transports goods for individuals and businesses. Choose the service closest to your job, or pick Not sure on the form.
      </PageHero>

      <section className="py-14">
        <div className="container-page space-y-6">
          {services.map((s) => {
            const Icon = serviceIcons[s.key];
            return (
              <article key={s.key} id={s.key} className="scroll-mt-28 rounded-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <Icon className="size-9 shrink-0 text-brand-600" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-brand-900">{s.title}</h2>
                    <p className="mt-2 text-lg text-muted">{s.short}</p>
                    <div className="mt-5 grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="font-bold text-brand-900">Examples</h3>
                        <ul className="mt-2 space-y-1">
                          {s.examples.map((e) => (
                            <li key={e} className="flex gap-2 text-muted">
                              <Check className="mt-1 size-4 shrink-0 text-brand-600" aria-hidden="true" /> {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-900">Good to know</h3>
                        <ul className="mt-2 space-y-1">
                          {s.considerations.map((c) => (
                            <li key={c} className="flex gap-2 text-muted">
                              <Check className="mt-1 size-4 shrink-0 text-brand-600" aria-hidden="true" /> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <TrackedLink kind="quote" location={`services_${s.key}`} href={`/request-a-quote?service=${s.key}`} className="btn-primary mt-6">
                      Request a quote<span className="sr-only"> for {s.title.toLowerCase()}</span>
                    </TrackedLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-14" aria-labelledby="how-h">
        <div className="container-page">
          <SectionHeading id="how-h" title="How it works" intro="Every request is reviewed by JMT. Your service is confirmed only after you agree the quote." />
          <HowItWorks />
        </div>
      </section>

      <CtaBand location="services_bottom" />
    </>
  );
}
