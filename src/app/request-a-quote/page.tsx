import { Phone } from "lucide-react";
import type { Metadata } from "next";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { GlowBackdrop } from "@/components/sections";
import { TrackedLink } from "@/components/TrackedLink";
import { business } from "@/content/site";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell JMT Enterprise what you need picked up and delivered. JMT reviews your request and contacts you with a quote.",
  alternates: { canonical: "/request-a-quote" },
};

export default function RequestQuotePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-950 pb-28 pt-12 text-white sm:pt-16">
        <GlowBackdrop />
        <div className="container-page relative max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Request a <span className="text-gradient">quote</span>
          </h1>
          <p className="mt-4 text-lg text-brand-100/90">
            Four short steps, no account needed. JMT reviews your request and contacts you with a price and availability.
          </p>
          <p className="mt-4 text-brand-200">
            Prefer to talk?{" "}
            <TrackedLink kind="phone" location="quote_page" href={business.phoneHref} className="inline-flex items-center gap-1 font-semibold text-accent-300 underline underline-offset-4 hover:text-accent-400">
              <Phone className="size-4" aria-hidden="true" /> Call {business.phoneDisplay}
            </TrackedLink>
          </p>
        </div>
      </section>
      <section className="relative -mt-20 pb-16">
        <div className="container-page">
          <noscript>
            <p className="card mx-auto mb-6 max-w-3xl p-5 text-center font-medium">
              This form needs JavaScript. You can also call <a className="font-bold text-brand-700 underline" href={business.phoneHref}>{business.phoneDisplay}</a> or email{" "}
              <a className="font-bold text-brand-700 underline" href={business.emailHref}>{business.email}</a>.
            </p>
          </noscript>
          <QuoteForm />
        </div>
      </section>
    </>
  );
}
