import { Truck } from "lucide-react";
import { pendingContent } from "@/content/site";
import { isProductionSite } from "@/lib/site-env";

/**
 * TEMPORARY wordmark. Replace with the client's original logo file
 * (pendingContent.logo) in public/brand/ and render it here with next/image.
 */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-[0_6px_16px_-6px_rgb(33_63_156/0.7)] ring-1 ring-white/20"
        aria-hidden="true"
      >
        <Truck className="size-5" />
      </span>
      <span className={`whitespace-nowrap text-lg font-extrabold leading-tight tracking-tight ${onDark ? "text-white" : "text-brand-900"}`}>
        JMT<span className={onDark ? "text-accent-400" : "text-brand-700"}> Enterprise</span>
        {pendingContent.logo && !isProductionSite && (
          <span className="ml-2 hidden whitespace-nowrap rounded-full bg-amber-200 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-amber-900 sm:inline">
            Logo pending
          </span>
        )}
      </span>
    </span>
  );
}
