import { Clock, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { GlowBackdrop, PageHero } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Call ${business.phoneDisplay} or email ${business.email}. For a price, send a quote request with your pickup and delivery details.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Contact JMT Enterprise">
        For a price, the quickest way is a quote request with your item and address details.
      </PageHero>
      <section className="py-16">
        <div className="container-page grid max-w-4xl gap-6 md:grid-cols-2">
          <TrackedLink kind="phone" location="contact" href={business.phoneHref} data-reveal className="group card card-hover flex items-start gap-4 p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"><Phone className="size-6" aria-hidden="true" /></span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide text-slate-500">Call</span>
              <span className="text-xl font-bold text-brand-900">{business.phoneDisplay}</span>
            </span>
          </TrackedLink>
          <TrackedLink kind="email" location="contact" href={business.emailHref} data-reveal className="group card card-hover flex items-start gap-4 p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"><Mail className="size-6" aria-hidden="true" /></span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide text-slate-500">Email</span>
              <span className="break-all text-xl font-bold text-brand-900">{business.email}</span>
            </span>
          </TrackedLink>
          {business.hours && (
            <div data-reveal className="card flex items-start gap-4 p-6 md:col-span-2">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-brand-600"><Clock className="size-6" aria-hidden="true" /></span>
              <div className="flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Hours</h2>
                <p className="text-lg text-brand-900">{business.hours}</p>
              </div>
            </div>
          )}
          <div data-reveal className="relative isolate overflow-hidden rounded-3xl bg-brand-950 p-8 text-white md:col-span-2">
            <GlowBackdrop />
            <h2 className="text-2xl font-extrabold">Need a price?</h2>
            <p className="mt-2 text-brand-100/90">Send your pickup and delivery details and JMT will contact you with a quote and availability.</p>
            <TrackedLink kind="quote" location="contact" href="/request-a-quote" className="btn-primary mt-4">
              Request a Quote
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
