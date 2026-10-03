"use client";

import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { business } from "@/content/site";
import { TrackedLink } from "./TrackedLink";

/** Persistent mobile quote/call actions. Hidden on the form so it never covers controls. */
export function MobileActionBar() {
  const pathname = usePathname();
  if (pathname === "/request-a-quote" || pathname === "/request-received") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
      <TrackedLink kind="phone" location="mobile_bar" href={business.phoneHref} className="btn-secondary text-sm">
        <Phone className="size-4" aria-hidden="true" /> Call
      </TrackedLink>
      <TrackedLink kind="quote" location="mobile_bar" href="/request-a-quote" className="btn-primary text-sm">
        Request a Quote
      </TrackedLink>
    </div>
  );
}
