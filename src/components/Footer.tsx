import { ArrowUpRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { business, nav } from "@/content/site";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";

export function Footer() {
  const links = [{ href: "/", label: "Home" }, ...nav, { href: "/request-a-quote", label: "Request a Quote" }, { href: "/privacy-policy", label: "Privacy Policy" }, { href: "/service-terms", label: "Service Terms" }];
  return (
    <footer className="relative isolate overflow-hidden bg-brand-950 pb-28 pt-16 text-brand-100 lg:pb-12">
      <div aria-hidden="true" className="absolute -top-40 left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="container-page grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo onDark className="h-14 w-auto" />
          <p className="mt-5 max-w-sm text-brand-100/80">Pickup and delivery for individuals and businesses. Every job is quoted and confirmed by JMT before service.</p>
          <Link href="/request-a-quote" className="btn-primary group mt-6">
            Request a Quote <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Pages</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {links.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="transition-colors hover:text-accent-300">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <TrackedLink kind="phone" location="footer" href={business.phoneHref} className="group inline-flex items-center gap-3 transition-colors hover:text-white">
                <span className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-accent-400 group-hover:text-brand-950"><Phone className="size-4" aria-hidden="true" /></span>
                {business.phoneDisplay}
              </TrackedLink>
            </li>
            <li>
              <TrackedLink kind="email" location="footer" href={business.emailHref} className="group inline-flex items-center gap-3 transition-colors hover:text-white">
                <span className="grid size-9 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-accent-400 group-hover:text-brand-950"><Mail className="size-4" aria-hidden="true" /></span>
                {business.email}
              </TrackedLink>
            </li>
          </ul>
        </div>
      </div>
      <p className="container-page mt-12 border-t border-white/10 pt-6 text-xs text-brand-300">
        © {new Date().getFullYear()} {business.name}. All rights reserved.
      </p>
    </footer>
  );
}
