import { ArrowRight, Armchair, Box, Building2, CalendarClock, Car, Check, Gem, Home, Package, Phone, ShoppingBag, Truck, Users, Weight } from "lucide-react";
import Link from "next/link";
import { business, faqs, howItWorks, services, vehicles, type Faq, type ServiceKey, type VehicleKey } from "@/content/site";
import { TrackedLink } from "./TrackedLink";

export const serviceIcons: Record<ServiceKey, typeof Truck> = {
  "marketplace-pickup": ShoppingBag,
  "furniture-appliance": Armchair,
  "heavy-oversized": Weight,
  "fragile-specialty": Gem,
  "home-to-home": Home,
  "small-business": Building2,
  "same-day-scheduled": CalendarClock,
};

const vehicleIcons: Record<VehicleKey, typeof Truck> = { car: Car, "pickup-truck": Truck, "cargo-van": Package, "box-truck": Box };

/** Dark gradient band with animated glow used for page headers. */
export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 pb-16 pt-14 text-white sm:pb-20 sm:pt-20">
      <GlowBackdrop />
      <div className="container-page relative max-w-4xl">
        {eyebrow && (
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-300 backdrop-blur">
            <span className="size-1.5 rounded-full bg-accent-400" aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-lg text-brand-100/90">{children}</div>}
      </div>
    </section>
  );
}

export function GlowBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-brand-500/35 blur-2xl md:animate-blob md:blur-3xl" />
      <div className="absolute -right-20 top-10 size-[24rem] rounded-full bg-accent-500/20 blur-2xl [animation-delay:-6s] md:animate-blob md:blur-3xl" />
      <div className="absolute bottom-[-12rem] left-1/3 hidden size-[26rem] rounded-full bg-indigo-500/25 blur-3xl [animation-delay:-12s] md:block md:animate-blob" />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, intro, id, center = false }: { eyebrow?: string; title: string; intro?: string; id?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`} data-reveal>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-brand-900 sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
    </div>
  );
}

function IconChip({ icon: Icon, tone = "brand" }: { icon: typeof Truck; tone?: "brand" | "accent" }) {
  return (
    <span
      className={`grid size-10 place-items-center rounded-xl text-white shadow-lg sm:size-12 sm:rounded-2xl transition-transform duration-500 ease-out-expo group-hover:-rotate-6 group-hover:scale-110 ${
        tone === "brand" ? "bg-gradient-to-br from-brand-400 to-brand-700 shadow-brand-500/30" : "bg-gradient-to-br from-accent-400 to-accent-600 shadow-accent-500/30"
      }`}
      aria-hidden="true"
    >
      <Icon className="size-5 sm:size-6" />
    </span>
  );
}

export function ServiceGrid() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-3">
      {services.map((s, i) => {
        const Icon = serviceIcons[s.key];
        const featured = i === 0;
        return (
          <li
            key={s.key}
            data-reveal
            style={{ "--d": i % 3 } as React.CSSProperties}
            className={`group card card-hover relative flex flex-col overflow-hidden p-4 sm:p-7 ${featured ? "col-span-2" : ""} ${i === services.length - 1 ? "lg:col-span-2" : ""}`}
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-brand-100 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex-1">
              <IconChip icon={Icon} tone={featured ? "accent" : "brand"} />
              <h3 className={`mt-3 font-extrabold leading-snug tracking-tight text-brand-900 sm:mt-5 ${featured ? "text-xl sm:text-3xl" : "text-[15px] sm:text-xl"}`}>{s.title}</h3>
              <p className={`mt-2 text-muted ${featured ? "text-sm sm:text-base" : "hidden sm:block"}`}>{s.short}</p>
            </div>
            <div className="relative mt-auto pt-3 sm:pt-5">
              <ul className="hidden flex-wrap gap-2 sm:flex">
                {s.examples.slice(0, featured ? 3 : 2).map((e) => (
                  <li key={e} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {e}
                  </li>
                ))}
              </ul>
              <Link href={`/services#${s.key}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 after:absolute after:inset-0 sm:mt-5 sm:text-base">
                Learn more<span className="sr-only"> about {s.title.toLowerCase()}</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Infinite strip of everyday items. Decorative; the same items appear in the service cards. */
export function ItemMarquee() {
  const items = ["Sofas", "Refrigerators", "Marketplace finds", "Washers & dryers", "Antique cabinets", "Mirrors & art", "Office furniture", "Exercise equipment", "Store deliveries", "Mattresses", "Dressers", "Outdoor sets"];
  const row = [...items, ...items];
  return (
    <div aria-hidden="true" className="relative overflow-hidden border-y border-slate-200/80 bg-white py-5 [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
      <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-3 whitespace-nowrap text-base font-bold text-slate-600 sm:text-lg">
            {t}
            <span className="size-1.5 rounded-full bg-accent-400" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function WhoWeHelp() {
  const groups = [
    {
      icon: Users,
      tone: "brand" as const,
      title: "Individuals and households",
      points: ["Marketplace and private-sale pickups", "Furniture and appliances for your home", "Items moving between homes", "Fragile pieces and antiques"],
    },
    {
      icon: Building2,
      tone: "accent" as const,
      title: "Small businesses",
      points: ["Deliveries to your customers", "Equipment, fixtures and office furniture", "Supplies between locations", "One-off or planned runs"],
    },
  ];
  return (
    <div className="mt-12 grid gap-5 md:grid-cols-2">
      {groups.map((g, i) => (
        <div key={g.title} data-reveal style={{ "--d": i } as React.CSSProperties} className="group card card-hover relative overflow-hidden p-8">
          <div aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${g.tone === "brand" ? "from-brand-400 to-brand-700" : "from-accent-400 to-accent-600"}`} />
          <IconChip icon={g.icon} tone={g.tone} />
          <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-brand-900">{g.title}</h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {g.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-muted">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600" aria-hidden="true">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <ol className="relative mt-10 grid gap-6 sm:mt-14 md:grid-cols-4 md:gap-6">
      <div aria-hidden="true" className="absolute left-6 top-6 hidden h-0.5 w-[calc(100%-3rem)] bg-gradient-to-r from-brand-200 via-accent-300 to-brand-200 md:block" />
      <div aria-hidden="true" className="absolute bottom-6 left-6 top-6 w-0.5 bg-gradient-to-b from-brand-200 via-accent-300 to-brand-200 md:hidden" />
      {howItWorks.map((s, i) => (
        <li key={s.title} data-reveal style={{ "--d": i } as React.CSSProperties} className="relative flex gap-5 md:block">
          <span
            className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold text-white shadow-lg ring-4 ring-white ${
              i === howItWorks.length - 1 ? "animate-pulse-ring bg-gradient-to-br from-accent-400 to-accent-600" : "bg-gradient-to-br from-brand-500 to-brand-800"
            }`}
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <div className="md:mt-6">
            <h3 className="text-lg font-extrabold text-brand-900">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="mt-2 text-muted">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function VehicleOptions() {
  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
        {vehicles.map((v, i) => {
          const Icon = vehicleIcons[v.key];
          return (
            <li key={v.key} data-reveal style={{ "--d": i } as React.CSSProperties} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:rounded-3xl sm:p-7 transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:border-accent-400/40 hover:bg-white/[0.08]">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand-300">0{i + 1}</span>
              <Icon className="mt-3 size-9 text-accent-400 sm:mt-4 sm:size-12 transition-transform duration-500 ease-out-expo group-hover:translate-x-2" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-3 text-base font-extrabold text-white sm:mt-5 sm:text-xl">{v.title}</h3>
              <p className="mt-1 text-sm text-brand-100/80 sm:mt-2 sm:text-base">{v.goodFor}</p>
            </li>
          );
        })}
      </ul>
      <div data-reveal className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-accent-400/30 bg-accent-400/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-brand-50">
          <strong className="text-white">Not sure which vehicle you need?</strong> Choose <em>Not sure</em> on the request form. JMT reviews your items and confirms
          the right vehicle with your quote.
        </p>
        <Link href="/request-a-quote" className="btn-primary shrink-0">
          Start a request
        </Link>
      </div>
    </>
  );
}

export function FaqList({ items = faqs }: { items?: Faq[] }) {
  return (
    <div className="mt-10 space-y-3">
      {items.map((f, i) => (
        <details key={f.q} data-reveal style={{ "--d": i % 4 } as React.CSSProperties} className="group card overflow-hidden px-6 py-5 transition-colors open:border-brand-200 open:bg-brand-50/40">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xl text-brand-600 transition-all duration-300 group-open:rotate-45 group-open:bg-accent-400 group-open:text-brand-950" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="mt-3 pr-10 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = "Tell us what you need moved", location }: { title?: string; location: string }) {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div data-reveal className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand-950 px-6 py-14 text-white sm:px-12 sm:py-16">
        <GlowBackdrop />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
            <p className="mt-3 text-lg text-brand-100/90">Send your details and JMT will contact you with a quote and availability. No account needed.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <TrackedLink kind="quote" location={location} href="/request-a-quote" className="btn-primary group text-lg">
              Request a Quote
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </TrackedLink>
            <TrackedLink kind="phone" location={location} href={business.phoneHref} className="btn-on-dark text-lg">
              <Phone className="size-5" aria-hidden="true" /> {business.phoneDisplay}
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}
