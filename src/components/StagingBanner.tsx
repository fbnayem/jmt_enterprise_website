import { isProductionSite } from "@/lib/site-env";

export function StagingBanner() {
  if (isProductionSite) return null;
  return (
    <div className="bg-amber-300 px-4 py-1.5 text-center text-xs font-semibold text-amber-950 sm:text-sm">
      Staging preview. Yellow boxes mark content awaiting JMT. Requests use development services and no real email is sent.
    </div>
  );
}
