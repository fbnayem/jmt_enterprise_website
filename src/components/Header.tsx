"use client";

import { ArrowRight, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { business, nav } from "@/content/site";
import { Logo } from "./Logo";
import { TrackedLink } from "./TrackedLink";

export function Header() {
  const pathname = usePathname();
  // Remember which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  const close = (returnFocus = true) => {
    setOpenOn(null);
    if (returnFocus) toggleRef.current?.focus();
  };

  // Menu open: move focus into it, close on Escape, and lock page scroll.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenOn(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled || open ? "border-b border-slate-200/70 bg-white/85 shadow-[0_8px_30px_-12px_rgb(12_23_56/0.18)] backdrop-blur-xl" : "border-b border-transparent bg-white/70 backdrop-blur-md"
      }`}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Link href="/" aria-label={`${business.shortName} home`} className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className="group relative whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-semibold text-slate-600 transition-colors hover:text-brand-700 aria-[current=page]:text-brand-700"
                >
                  {n.label}
                  <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 transition-transform duration-300 ease-out-expo group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <TrackedLink kind="phone" location="header" href={business.phoneHref} className="hidden items-center gap-2 whitespace-nowrap text-[15px] font-bold text-brand-800 transition-colors hover:text-brand-600 xl:inline-flex">
            <span className="grid size-8 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Phone className="size-4" aria-hidden="true" />
            </span>
            {business.phoneDisplay}
          </TrackedLink>
          <TrackedLink kind="quote" location="header" href="/request-a-quote" className="btn-primary group min-h-11 whitespace-nowrap px-5 py-2.5 text-[15px]">
            Request a Quote
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </TrackedLink>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <TrackedLink kind="phone" location="header_mobile" href={business.phoneHref} className="grid size-11 place-items-center rounded-full bg-brand-50 text-brand-700" aria-label={`Call ${business.phoneDisplay}`}>
            <Phone className="size-5" aria-hidden="true" />
          </TrackedLink>
          <button
            ref={toggleRef}
            type="button"
            className="grid size-11 place-items-center rounded-full text-brand-900 transition-colors hover:bg-slate-100"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenOn(open ? null : pathname)}
          >
            {open ? <X className="size-6" aria-hidden="true" /> : <Menu className="size-6" aria-hidden="true" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>
      {open && (
        <>
          <div aria-hidden="true" className="absolute inset-x-0 top-full h-[100dvh] bg-brand-950/40 lg:hidden" onClick={() => close(false)} />
        <nav ref={menuRef} id="mobile-nav" aria-label="Mobile" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] animate-fade-up overflow-y-auto overscroll-contain border-t border-slate-200/70 bg-white shadow-[0_24px_48px_-16px_rgb(7_14_36/0.35)] lg:hidden">
          <ul className="container-page flex flex-col gap-1 py-3">
            {nav.map((n, i) => (
              <li key={n.href} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href={n.href}
                  aria-current={pathname === n.href ? "page" : undefined}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 text-lg font-semibold text-slate-800 hover:bg-brand-50 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-700"
                >
                  {n.label}
                  <ArrowRight className="size-4 text-slate-400" aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/request-a-quote" className="btn-primary w-full">
                Request a Quote
              </Link>
            </li>
          </ul>
        </nav>
        </>
      )}
    </header>
  );
}
