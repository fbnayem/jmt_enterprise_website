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
    <aside aria-label="Quick actions" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 grid grid-cols-[auto_1fr] gap-2 rounded-full border border-white/60 bg-white/85 p-1.5 shadow-[0_12px_40px_-12px_rgb(10_26_61/0.45)] backdrop-blur-xl lg:hidden">
      <TrackedLink kind="phone" location="mobile_bar" href={business.phoneHref} className="btn min-h-11 border border-brand-200 bg-white px-4 text-sm text-brand-800" aria-label={`Call ${business.phoneDisplay}`}>
        <Phone className="size-4" aria-hidden="true" /> Call
      </TrackedLink>
      <TrackedLink kind="quote" location="mobile_bar" href="/request-a-quote" className="btn-primary min-h-11 text-sm">
        Request a Quote
      </TrackedLink>
    </aside>
  );
}
