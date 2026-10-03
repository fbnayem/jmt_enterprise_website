import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="py-24">
      <div className="container-page max-w-xl text-center">
        <h1 className="text-3xl font-extrabold text-brand-900">Page not found</h1>
        <p className="mt-4 text-muted">The page you are looking for does not exist or has moved.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-secondary">Home</Link>
          <Link href="/request-a-quote" className="btn-primary">Request a Quote</Link>
        </div>
      </div>
    </section>
  );
}
