import { Truck } from "lucide-react";
import { business, pendingContent } from "@/content/site";
import { isProductionSite } from "@/lib/site-env";

/**
 * TEMPORARY wordmark. Replace with the client's original logo file
 * (pendingContent.logo) in public/brand/ and render it here with next/image.
 */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`grid size-10 place-items-center rounded-lg ${onDark ? "bg-white text-brand-800" : "bg-brand-800 text-white"}`}
        aria-hidden="true"
      >
        <Truck className="size-6" />
      </span>
      <span className={`text-lg font-extrabold leading-tight tracking-tight ${onDark ? "text-white" : "text-brand-900"}`}>
        {business.shortName}
        {pendingContent.logo && !isProductionSite && (
          <span className="ml-2 hidden rounded bg-amber-200 px-1.5 py-0.5 align-middle text-[10px] sm:inline font-bold uppercase tracking-wide text-amber-900">
            Logo pending
          </span>
        )}
      </span>
    </span>
  );
}
