import { MapPin, PackageCheck, Truck } from "lucide-react";

/**
 * Decorative pickup-to-drop-off illustration for the hero. It shows the
 * request flow rather than a photo, so it makes no claim about JMT's fleet.
 */
export function RouteIllustration() {
  const path = "M70 300 C 160 120, 300 360, 430 140";
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[5/4] w-full max-w-lg">
      <div className="absolute inset-0 rounded-[2.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm" />
      
      <svg viewBox="0 0 500 400" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id="route" x1="0" x2="1">
            <stop offset="0" stopColor="#8aa6dc" />
            <stop offset="1" stopColor="#f66b6b" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="18" strokeLinecap="round" />
        <path d={path} fill="none" stroke="url(#route)" strokeWidth="4" strokeDasharray="12 12" strokeLinecap="round" className="animate-dash" />
        <g className="animate-drive" style={{ offsetPath: `path("${path}")`, offsetRotate: "0deg" }}>
          <rect x="-26" y="-26" width="52" height="52" rx="16" fill="#c8161a" />
          <Truck x="-14" y="-14" width="28" height="28" color="#ffffff" />
        </g>
      </svg>
      <div className="absolute left-[4%] top-[62%] animate-float rounded-2xl border border-white/15 bg-brand-900/80 p-3 pr-5 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-500/30 text-brand-200">
            <MapPin className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Pickup</p>
            <p className="text-sm font-bold text-white">Seller&apos;s address</p>
          </div>
        </div>
      </div>

      <div className="absolute right-[3%] top-[12%] animate-float rounded-2xl border border-white/15 bg-brand-900/80 p-3 pr-5 shadow-2xl backdrop-blur [animation-delay:-3.5s]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent-400/25 text-accent-400">
            <PackageCheck className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">Drop-off</p>
            <p className="text-sm font-bold text-white">Your door</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[6%] right-[8%] hidden animate-float sm:block rounded-2xl border border-white/15 bg-white p-4 text-ink shadow-2xl [animation-delay:-1.5s]">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Quote request</p>
        <p className="mt-1 text-sm font-bold">Sofa, 3-seat · Pickup truck</p>
        <div className="mt-3 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1.5 w-8 rounded-full ${i < 3 ? "bg-gradient-to-r from-brand-400 to-brand-600" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
