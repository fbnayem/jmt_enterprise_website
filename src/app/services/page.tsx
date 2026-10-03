import { ArrowRight, Check } from "lucide-react";
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

      <section className="py-16 sm:py-20">
        <div className="container-page space-y-6">
          {services.map((s, i) => {
            const Icon = serviceIcons[s.key];
            return (
              <article key={s.key} id={s.key} data-reveal className="group card card-hover relative scroll-mt-28 overflow-hidden p-6 sm:p-10">
                <span aria-hidden="true" className="absolute right-6 top-4 text-7xl font-extrabold text-slate-100 transition-colors duration-500 group-hover:text-brand-50 sm:text-8xl">0{i + 1}</span>
                <div className="relative flex flex-col items-start gap-5 sm:flex-row">
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110" aria-hidden="true">
                    <Icon className="size-7" />
                  </span>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">{s.title}</h2>
                    <p className="mt-2 text-lg text-muted">{s.short}</p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <h3 className="font-bold text-brand-900">Examples</h3>
                        <ul className="mt-2 space-y-1">
                          {s.examples.map((e) => (
                            <li key={e} className="flex gap-2 text-muted">
                              <Check className="mt-1 size-4 shrink-0 text-accent-600" strokeWidth={3} aria-hidden="true" /> {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <h3 className="font-bold text-brand-900">Good to know</h3>
                        <ul className="mt-2 space-y-1">
                          {s.considerations.map((c) => (
                            <li key={c} className="flex gap-2 text-muted">
                              <Check className="mt-1 size-4 shrink-0 text-accent-600" strokeWidth={3} aria-hidden="true" /> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <TrackedLink kind="quote" location={`services_${s.key}`} href={`/request-a-quote?service=${s.key}`} className="btn-primary group/b mt-6">
                      Request a quote<span className="sr-only"> for {s.title.toLowerCase()}</span>
                      <ArrowRight className="size-4 transition-transform duration-300 group-hover/b:translate-x-1" aria-hidden="true" />
                    </TrackedLink>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-dots bg-slate-50 py-20" aria-labelledby="how-h">
        <div className="container-page">
          <SectionHeading eyebrow="Process" id="how-h" title="How it works" intro="Every request is reviewed by JMT before you hear back with a quote." />
          <HowItWorks />
        </div>
      </section>

      <CtaBand location="services_bottom" />
    </>
  );
}
