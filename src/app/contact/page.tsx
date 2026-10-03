import { Clock, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import { Placeholder } from "@/components/Placeholder";
import { PageHero } from "@/components/sections";
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
      <section className="py-14">
        <div className="container-page grid max-w-4xl gap-6 md:grid-cols-2">
          <TrackedLink kind="phone" location="contact" href={business.phoneHref} className="flex items-start gap-4 rounded-xl border border-slate-200 p-6 hover:border-brand-600">
            <Phone className="size-7 shrink-0 text-brand-600" aria-hidden="true" />
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide text-slate-500">Call</span>
              <span className="text-xl font-bold text-brand-900">{business.phoneDisplay}</span>
            </span>
          </TrackedLink>
          <TrackedLink kind="email" location="contact" href={business.emailHref} className="flex items-start gap-4 rounded-xl border border-slate-200 p-6 hover:border-brand-600">
            <Mail className="size-7 shrink-0 text-brand-600" aria-hidden="true" />
            <span>
              <span className="block text-sm font-bold uppercase tracking-wide text-slate-500">Email</span>
              <span className="break-all text-xl font-bold text-brand-900">{business.email}</span>
            </span>
          </TrackedLink>
          <div className="flex items-start gap-4 rounded-xl border border-slate-200 p-6 md:col-span-2">
            <Clock className="size-7 shrink-0 text-brand-600" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Hours</h2>
              {business.hours ? (
                <p className="text-lg text-brand-900">{business.hours}</p>
              ) : (
                <div className="mt-2">
                  <Placeholder title="Confirmed hours of operation" />
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-brand-50 p-6 md:col-span-2">
            <h2 className="text-xl font-bold text-brand-900">Need a price?</h2>
            <p className="mt-2 text-muted">Send your pickup and delivery details and JMT will contact you with a quote and availability.</p>
            <TrackedLink kind="quote" location="contact" href="/request-a-quote" className="btn-primary mt-4">
              Request a Quote
            </TrackedLink>
          </div>
        </div>
      </section>
    </>
  );
}
