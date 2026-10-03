"use client";

import { Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { business, nav } from "@/content/site";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";

export function Header() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link href="/" aria-label={`${business.name} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className="font-medium text-slate-700 hover:text-brand-700 aria-[current=page]:text-brand-700 aria-[current=page]:underline aria-[current=page]:underline-offset-8"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <TrackedLink kind="phone" location="header" href={business.phoneHref} className="inline-flex items-center gap-2 font-semibold text-brand-800 hover:underline">
            <Phone className="size-4" aria-hidden="true" /> {business.phoneDisplay}
          </TrackedLink>
          <TrackedLink kind="quote" location="header" href="/request-a-quote" className="btn-primary">
            Request a Quote
          </TrackedLink>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <TrackedLink kind="phone" location="header_mobile" href={business.phoneHref} className="grid size-12 place-items-center rounded-lg text-brand-800" aria-label={`Call ${business.phoneDisplay}`}>
            <Phone className="size-6" aria-hidden="true" />
          </TrackedLink>
          <button
            type="button"
            className="grid size-12 place-items-center rounded-lg text-brand-900"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X className="size-7" aria-hidden="true" /> : <Menu className="size-7" aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-200 bg-white lg:hidden">
          <ul className="container-page flex flex-col py-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block py-3 text-lg font-medium text-slate-800">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <Link href="/request-a-quote" className="btn-primary w-full">
                Request a Quote
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
