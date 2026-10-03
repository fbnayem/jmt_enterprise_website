import { isProductionSite } from "@/lib/site-env";

/**
 * Visible staging placeholder for content the client has not supplied yet.
 * It never renders invented details; `npm run check:launch` blocks a public
 * launch while any pending content remains.
 */
export function Placeholder({ title, children }: { title: string; children?: React.ReactNode }) {
  if (isProductionSite) return null;
  return (
    <div role="note" className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/90 p-5 text-amber-950">
      <p className="text-xs font-bold uppercase tracking-wide">Staging placeholder: awaiting client content</p>
      <p className="mt-1 font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm">{children}</div>}
    </div>
  );
}
