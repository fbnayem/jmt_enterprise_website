import { isProductionSite } from "@/lib/site-env";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TrackedLink } from "@/components/TrackedLink";
import { business } from "@/content/site";
import { REFERENCE_PATTERN } from "@/lib/quote/reference";

export const metadata: Metadata = {
  title: "Request Received",
  robots: { index: false, follow: false },
};

/** Only the non-personal reference travels in the URL. */
export default async function RequestReceivedPage({ searchParams }: PageProps<"/request-received">) {
  const { ref } = await searchParams;
  const reference = typeof ref === "string" && REFERENCE_PATTERN.test(ref) ? ref : null;

  return (
    <section className="bg-dots py-16 sm:py-24">
      <div className="container-page max-w-2xl text-center">
        <span className="mx-auto grid size-20 animate-pulse-ring place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/30">
          <CheckCircle2 className="size-10" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance text-brand-900 sm:text-4xl">Thank you. Your quote request has been received.</h1>
        {!isProductionSite && (
          <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
            Preview only: this request was not sent to JMT Enterprise and no email was sent.
          </p>
        )}
        {reference ? (
          <p className="mt-4 text-lg text-muted">
            Your reference is <strong className="whitespace-nowrap rounded-lg bg-brand-50 px-2 py-1 font-mono text-brand-900">{reference}</strong>.
          </p>
        ) : (
          <p className="mt-4 text-lg text-muted">Your reference is in the confirmation email we sent you.</p>
        )}
        <p className="mt-4 text-lg text-muted">
          {business.shortName} will review your details and contact you with a quote and availability. Your pickup or delivery is
          confirmed only after JMT agrees the service with you.
        </p>
        <div className="card mt-10 p-6 text-left sm:p-8">
          <h2 className="font-bold text-brand-900">What happens next</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted marker:font-bold marker:text-brand-600">
            <li>We email you a receipt with your reference. Check your spam folder if it does not arrive.</li>
            <li>JMT reviews your request and contacts you with a quote and availability.</li>
            <li>Your pickup or delivery is booked only once you and JMT agree the details.</li>
          </ol>
          <p className="mt-4 text-muted">
            Need to change something? Call{" "}
            <TrackedLink kind="phone" location="received" href={business.phoneHref} className="font-semibold text-brand-600 underline underline-offset-4">
              {business.phoneDisplay}
            </TrackedLink>{" "}
            and mention your reference.
          </p>
        </div>
        <Link href="/" className="btn-secondary mt-8">
          Back to home
        </Link>
      </div>
    </section>
  );
}
