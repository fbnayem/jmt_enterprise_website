import { Armchair, Box, Building2, CalendarClock, Car, Check, Gem, Home, Package, Phone, ShoppingBag, Truck, Users, Weight } from "lucide-react";
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

export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="bg-brand-50 py-12 sm:py-16">
      <div className="container-page max-w-3xl">
        {eyebrow && <p className="text-sm font-bold uppercase tracking-wide text-brand-600">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
        {children && <div className="mt-4 text-lg text-muted">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({ title, intro, id }: { title: string; intro?: string; id?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
    </div>
  );
}

export function ServiceGrid() {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => {
        const Icon = serviceIcons[s.key];
        return (
          <li key={s.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Icon className="size-8 text-brand-600" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-bold text-brand-900">{s.title}</h3>
            <p className="mt-2 flex-1 text-muted">{s.short}</p>
            <p className="mt-3 text-sm text-slate-600">For example: {s.examples.slice(0, 2).join(", ").toLowerCase()}.</p>
            <Link href={`/services#${s.key}`} className="mt-4 font-semibold text-brand-700 underline-offset-4 hover:underline">
              Learn more<span className="sr-only"> about {s.title.toLowerCase()}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function WhoWeHelp() {
  const groups = [
    {
      icon: Users,
      title: "Individuals and households",
      points: ["Marketplace and private-sale pickups", "Furniture and appliances for your home", "Items moving between homes", "Fragile pieces and antiques"],
    },
    {
      icon: Building2,
      title: "Small businesses",
      points: ["Deliveries to your customers", "Equipment, fixtures and office furniture", "Supplies between locations", "One-off or planned runs"],
    },
  ];
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <div key={g.title} className="rounded-xl border border-slate-200 bg-white p-6">
          <g.icon className="size-8 text-brand-600" aria-hidden="true" />
          <h3 className="mt-3 text-xl font-bold text-brand-900">{g.title}</h3>
          <ul className="mt-3 space-y-2">
            {g.points.map((p) => (
              <li key={p} className="flex gap-2 text-muted">
                <Check className="mt-1 size-4 shrink-0 text-brand-600" aria-hidden="true" /> {p}
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
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {howItWorks.map((s, i) => (
        <li key={s.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <span className="grid size-10 place-items-center rounded-full bg-brand-800 font-bold text-white" aria-hidden="true">
            {i + 1}
          </span>
          <h3 className="mt-3 text-lg font-bold text-brand-900">
            <span className="sr-only">Step {i + 1}: </span>
            {s.title}
          </h3>
          <p className="mt-2 text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function VehicleOptions() {
  return (
    <>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((v) => {
          const Icon = vehicleIcons[v.key];
          return (
            <li key={v.key} className="rounded-xl border border-slate-200 bg-white p-6">
              <Icon className="size-8 text-brand-600" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold text-brand-900">{v.title}</h3>
              <p className="mt-2 text-muted">{v.goodFor}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 rounded-lg bg-brand-50 p-4 text-brand-900">
        <strong>Not sure which vehicle you need?</strong> Choose <em>Not sure</em> on the request form. JMT reviews your items and
        confirms the right vehicle with your quote.
      </p>
    </>
  );
}

export function FaqList({ items = faqs }: { items?: Faq[] }) {
  return (
    <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.map((f) => (
        <details key={f.q} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-brand-900">
            {f.q}
            <span className="text-2xl text-brand-600 transition-transform group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="mt-3 text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CtaBand({ title = "Tell us what you need moved", location }: { title?: string; location: string }) {
  return (
    <section className="bg-brand-800 py-14 text-white">
      <div className="container-page flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
          <p className="mt-2 text-brand-100">Send your details and JMT will contact you with a quote and availability.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <TrackedLink kind="quote" location={location} href="/request-a-quote" className="btn-primary">
            Request a Quote
          </TrackedLink>
          <TrackedLink kind="phone" location={location} href={business.phoneHref} className="btn-on-dark">
            <Phone className="size-5" aria-hidden="true" /> Call {business.phoneDisplay}
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}
