import { Phone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { QuoteForm } from "@/components/quote/QuoteForm";
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
      <section className="bg-brand-50 py-10">
        <div className="container-page max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">Request a quote</h1>
          <p className="mt-3 text-lg text-muted">
            Four short steps. No account needed. JMT reviews your request and contacts you with a price and availability. Nothing is
            booked until you agree the service.
          </p>
          <p className="mt-3 text-muted">
            Prefer to talk?{" "}
            <TrackedLink kind="phone" location="quote_page" href={business.phoneHref} className="inline-flex items-center gap-1 font-semibold text-brand-700 underline">
              <Phone className="size-4" aria-hidden="true" /> Call {business.phoneDisplay}
            </TrackedLink>
          </p>
        </div>
      </section>
      <section className="py-10">
        <div className="container-page">
          <Suspense fallback={<p className="text-center text-muted">Loading the form…</p>}>
            <QuoteForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
