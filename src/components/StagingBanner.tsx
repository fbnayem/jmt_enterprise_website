import { isProductionSite } from "@/lib/site-env";

export function StagingBanner() {
  if (isProductionSite) return null;
  return (
    <div className="bg-amber-300 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      Staging preview. Yellow boxes mark content awaiting JMT. Requests use development services and no real email is sent.
    </div>
  );
}
