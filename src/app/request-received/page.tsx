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
    <section className="py-16">
      <div className="container-page max-w-2xl text-center">
        <CheckCircle2 className="mx-auto size-16 text-green-600" aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-extrabold text-brand-900">Thank you. Your quote request has been received.</h1>
        {reference ? (
          <p className="mt-4 text-lg text-muted">
            Your reference is <strong className="whitespace-nowrap font-mono text-brand-900">{reference}</strong>.
          </p>
        ) : (
          <p className="mt-4 text-lg text-muted">Your reference is in the confirmation email we sent you.</p>
        )}
        <p className="mt-4 text-lg text-muted">
          {business.shortName} will review your details and contact you with a quote and availability. Your pickup or delivery is
          confirmed only after JMT agrees the service with you.
        </p>
        <div className="mt-8 rounded-xl bg-brand-50 p-6 text-left">
          <h2 className="font-bold text-brand-900">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
            <li>We email you a receipt with your reference. Check your spam folder if it does not arrive.</li>
            <li>JMT reviews your request and contacts you with a quote and availability.</li>
            <li>Your pickup or delivery is booked only once you and JMT agree the details.</li>
          </ol>
          <p className="mt-4 text-muted">
            Need to change something? Call{" "}
            <TrackedLink kind="phone" location="received" href={business.phoneHref} className="font-semibold text-brand-700 underline">
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
