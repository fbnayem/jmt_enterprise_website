import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { business, nav } from "@/content/site";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";

export function Footer() {
  return (
    <footer className="bg-brand-900 pb-24 pt-12 text-brand-100 lg:pb-12">
      <div className="container-page grid gap-10 md:grid-cols-3">
        <div>
          <Logo onDark />
          <p className="mt-4 max-w-xs text-sm">
            Pickup and delivery for individuals and businesses. Every job is quoted and confirmed by JMT before service.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Pages</h2>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[{ href: "/", label: "Home" }, ...nav, { href: "/request-a-quote", label: "Request a Quote" }, { href: "/privacy-policy", label: "Privacy Policy" }, { href: "/service-terms", label: "Service Terms" }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-white hover:underline">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <TrackedLink kind="phone" location="footer" href={business.phoneHref} className="inline-flex items-center gap-2 hover:text-white hover:underline">
                <Phone className="size-4" aria-hidden="true" /> {business.phoneDisplay}
              </TrackedLink>
            </li>
            <li>
              <TrackedLink kind="email" location="footer" href={business.emailHref} className="inline-flex items-center gap-2 hover:text-white hover:underline">
                <Mail className="size-4" aria-hidden="true" /> {business.email}
              </TrackedLink>
            </li>
          </ul>
        </div>
      </div>
      <p className="container-page mt-10 border-t border-white/15 pt-6 text-xs text-brand-200">
        © {new Date().getFullYear()} {business.name}. All rights reserved.
      </p>
    </footer>
  );
}
