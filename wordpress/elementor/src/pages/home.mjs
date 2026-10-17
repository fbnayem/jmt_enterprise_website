/** / (src/app/page.tsx). Home page; copy is verbatim from the Next.js page and src/components/sections.tsx. */
import { business, faqs, reasons, services, vehicles } from "../../../../src/content/site.ts";
import { ctaBand, eyebrowDark, faqAccordion, gradient, howItWorksSteps, navy, section, sectionHeading } from "../blocks.mjs";
import { box, button, container, heading, html, icon, iconBox, iconList, pct, px, text, tracking } from "../el.mjs";
import { color, width } from "../tokens.mjs";

/* ------------------------------------------------------------ helpers */

/** Standard section vertical rhythm: py-14 sm:py-24. */
const PY = { d: [96, 96], t: [96, 96], m: [56, 56] };
/** Grid rows size to content through the shared jmt-grid-auto class (see site.css). */
const AUTO_ROWS = {};
const CARD_BORDER = { width: 1, color: "rgba(226,232,240,0.8)" }; // border-slate-200/80

const serviceIcons = {
  "marketplace-pickup": "shopping-bag",
  "furniture-appliance": "couch",
  "heavy-oversized": "weight-hanging",
  "fragile-specialty": "gem",
  "home-to-home": "home",
  "small-business": "building",
  "same-day-scheduled": "calendar-alt",
};
const vehicleIcons = { car: "car", "pickup-truck": "truck-pickup", "cargo-van": "shuttle-van", "box-truck": "truck" };

/** IconChip: gradient square, 40px (mobile) / 48px (sm+), rounded-xl / sm:rounded-2xl. */
const chip = (tone) => ({
  view: "stacked",
  shape: "square",
  primary: tone === "accent" ? color.accent600 : color.brand600,
  secondary: color.white,
});

/* --------------------------------------------------------------- hero */

const lucide = (paths) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const TRUCK_PATHS =
  '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>';
const MAP_PIN = lucide(
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
);
const PACKAGE_CHECK = lucide(
  '<path d="M12 22V12"/><path d="m16 17 2 2 4-4"/><path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753"/><path d="M3.29 7 12 12l8.71-5"/><path d="m7.5 4.27 8.997 5.148"/>',
);
const ROUTE = "M70 300 C 160 120, 300 360, 430 140";

/** RouteIllustration (src/components/RouteIllustration.tsx), styled by the jmt-route* classes in site.css. */
const routeIllustration = `<div class="jmt-route" aria-hidden="true">
  <div class="jmt-route__panel"></div>
  <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="jmt-route-grad" x1="0" x2="1">
        <stop offset="0" stop-color="#8aa6dc"/>
        <stop offset="1" stop-color="#f66b6b"/>
      </linearGradient>
    </defs>
    <path d="${ROUTE}" fill="none" stroke="rgb(255 255 255 / 0.08)" stroke-width="18" stroke-linecap="round"/>
    <path d="${ROUTE}" fill="none" stroke="url(#jmt-route-grad)" stroke-width="4" stroke-dasharray="12 12" stroke-linecap="round" class="jmt-route__dash"/>
    <g class="jmt-route__truck">
      <rect x="-26" y="-26" width="52" height="52" rx="16" fill="#c8161a"/>
      <svg x="-14" y="-14" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TRUCK_PATHS}</svg>
    </g>
  </svg>
  <div class="jmt-route__card jmt-route__card--pickup">
    <span class="jmt-route__ico jmt-route__ico--pickup">${MAP_PIN}</span>
    <div>
      <p class="jmt-route__label jmt-route__label--pickup">Pickup</p>
      <p class="jmt-route__value">Seller&#39;s address</p>
    </div>
  </div>
  <div class="jmt-route__card jmt-route__card--drop">
    <span class="jmt-route__ico jmt-route__ico--drop">${PACKAGE_CHECK}</span>
    <div>
      <p class="jmt-route__label jmt-route__label--drop">Drop-off</p>
      <p class="jmt-route__value">Your door</p>
    </div>
  </div>
  <div class="jmt-route__card jmt-route__card--quote">
    <p class="jmt-route__label jmt-route__label--quote">Quote request</p>
    <p class="jmt-route__value">Sofa, 3-seat · Pickup truck</p>
    <div class="jmt-route__bars"><span class="on"></span><span class="on"></span><span class="on"></span><span></span></div>
  </div>
</div>`;

function hero() {
  return section(
    {
      ...navy,
      cls: "jmt-glow jmt-home-hero",
      y: { d: [96, 112], t: [80, 80], m: [56, 80] },
      grid: { cols: { d: 2, t: 1, m: 1 }, gap: 48, align: { d: "center" } },
      raw: {
        ...AUTO_ROWS,
      },
    },
    [
      container({}, [
        eyebrowDark("For individuals and businesses", { ping: true, reveal: 0 }),
        heading(`Pickup and Delivery for ${gradient("Everyday and Oversized")} Items`, {
          tag: "h1",
          size: { d: "6xl", t: "6xl", m: "4xl" },
          lh: 1.05,
          ls: tracking.tight,
          color: color.white,
          margin: [24, 0, 0, 0],
          reveal: 1,
        }),
        text(
          "<p>From Marketplace purchases and furniture to business deliveries, JMT Enterprise helps individuals and businesses move items with vehicle options to suit the job. Tell us what you need moved and request a quote.</p>",
          { size: "lg", color: color.brand100_90, margin: [24, 0, 0, 0], maxWidth: { d: 576, t: 576, m: pct(100) }, reveal: 2 },
        ),
        container({ dir: { d: "row", t: "row", m: "column" }, gap: 12, margin: [36, 0, 0, 0], reveal: 3 }, [
          button("Request a Quote", "/request-a-quote", { size: "lg", icon: "arrow-right", full: { m: "justify" } }),
          button(`Call ${business.phoneDisplay}`, business.phoneHref, {
            variant: "onDark",
            size: "lg",
            icon: "phone-alt",
            iconPos: "left",
            full: { m: "justify" },
          }),
        ]),
        iconList([{ text: "JMT reviews every request and confirms the price and service with you before anything is booked.", icon: "shield-alt" }], {
          size: "sm",
          textColor: color.brand200,
          iconColor: color.accent400,
          iconSize: 16,
          iconGap: 8,
          iconSelfAlign: "flex-start",
          margin: [24, 0, 0, 0],
          reveal: 4,
        }),
      ]),
      container({ raw: { animation: "fadeInUp", animation_delay: 200 } }, [html(routeIllustration)]),
    ],
  );
}

/* ------------------------------------------------------------ marquee */

const marqueeItems = ["Sofas", "Refrigerators", "Marketplace finds", "Washers & dryers", "Antique cabinets", "Mirrors & art", "Office furniture", "Exercise equipment", "Store deliveries", "Mattresses", "Dressers", "Outdoor sets"];
const esc = (s) => s.replace(/&/g, "&amp;");

function itemMarquee() {
  const row = [...marqueeItems, ...marqueeItems].map((t) => `<span class="jmt-marquee__item">${esc(t)}</span>`).join("");
  return container({}, [
    html(`<div class="jmt-marquee" aria-hidden="true"><div class="jmt-marquee__track">${row}</div></div>`),
  ]);
}

/* ----------------------------------------------------------- services */

function serviceCard(s, i) {
  const featured = i === 0;
  const last = i === services.length - 1;
  return container(
    {
      bg: color.white,
      border: CARD_BORDER,
      radius: 24,
      pad: { d: 28, t: 28, m: 16 },
      overflow: "hidden",
      reveal: i % 3,
      cls: ["jmt-card jmt-card-hover jmt-card-glow jmt-stretch", featured && "jmt-span-2", last && "jmt-span-2-lg"].filter(Boolean).join(" "),
    },
    [
      iconBox({
        icon: serviceIcons[s.key],
        title: s.title,
        desc: s.short,
        titleTag: "h3",
        position: { d: "top", t: "top", m: "top" },
        align: { d: "left", t: "left", m: "left" },
        ...chip(featured ? "accent" : "brand"),
        iconSize: { d: 24, t: 24, m: 20 },
        iconPad: { d: 12, t: 12, m: 10 },
        iconRadius: 16,
        iconGap: { d: 20, t: 20, m: 12 },
        titleGap: 8,
        titleColor: color.brand900,
        titleSize: featured ? { d: "3xl", t: "3xl", m: "xl" } : { d: "xl", t: "xl", m: 15 },
        titleLh: 1.375,
        titleLs: tracking.tight,
        descColor: color.muted,
        descSize: featured ? { d: "base", t: "base", m: "sm" } : "base",
        grow: true,
        cls: [featured ? "jmt-chip-accent" : "jmt-chip-brand", !featured && "jmt-hide-desc-m"].filter(Boolean).join(" "),
        raw: { border_radius_mobile: box(12) },
      }),
      container({ gap: 20, pad: { d: [20, 0, 0, 0], t: [20, 0, 0, 0], m: [12, 0, 0, 0] }, cls: "jmt-home-card-foot", raw: { _flex_size: "none" } }, [
        iconList(
          s.examples.slice(0, featured ? 3 : 2).map((e) => ({ text: e })),
          { inline: true, size: "xs", weight: 500, textColor: color.slate700, cls: "jmt-chips jmt-examples", hide: ["mobile"] },
        ),
        button(`Learn more<span class="elementor-screen-only"> about ${s.title.toLowerCase()}</span>`, `/services#${s.key}`, {
          variant: "link",
          icon: "arrow-right",
          iconGap: 6,
          cls: "jmt-stretch-link",
          widthAuto: true,
          raw: { typography_font_size_mobile: px(14), typography_line_height_mobile: { unit: "em", size: 1.429, sizes: [] } },
        }),
      ]),
    ],
  );
}

function servicesSection() {
  return section({ y: PY }, [
    sectionHeading({
      eyebrow: "Services",
      id: "services-h",
      title: "What we pick up and deliver",
      intro: "A sofa from a Marketplace seller, a new appliance, an antique or a store delivery. Tell us what it is and where it is going.",
    }),
    container(
      {
        grid: { cols: { d: 3, t: 2, m: 2 }, gap: { d: 20, t: 20, m: 12 } },
        margin: { d: [48, 0, 0, 0], t: [48, 0, 0, 0], m: [32, 0, 0, 0] },
        raw: AUTO_ROWS,
      },
      services.map(serviceCard),
    ),
  ]);
}

/* --------------------------------------------------------- who we help */

const groups = [
  {
    icon: "users",
    tone: "brand",
    title: "Individuals and households",
    points: ["Marketplace and private-sale pickups", "Furniture and appliances for your home", "Items moving between homes", "Fragile pieces and antiques"],
  },
  {
    icon: "building",
    tone: "accent",
    title: "Small businesses",
    points: ["Deliveries to your customers", "Equipment, fixtures and office furniture", "Supplies between locations", "One-off or planned runs"],
  },
];

function whoWeHelp() {
  return section({ y: PY, bg: color.slate50, cls: "jmt-dots" }, [
    sectionHeading({ eyebrow: "Who we help", id: "who-h", title: "Built for households and businesses", intro: "Households and businesses use the same simple request form." }),
    container(
      { grid: { cols: { d: 2, t: 2, m: 1 }, gap: 20 }, margin: [48, 0, 0, 0], raw: AUTO_ROWS },
      groups.map((g, i) =>
        container(
          {
            bg: color.white,
            border: CARD_BORDER,
            radius: 24,
            pad: 32,
            overflow: "hidden",
            reveal: i,
            cls: `jmt-card jmt-card-hover jmt-topbar-${g.tone}`,
          },
          [
            icon(g.icon, {
              ...chip(g.tone),
              size: { d: 24, t: 24, m: 20 },
              pad: { d: 12, t: 12, m: 10 },
              radius: 16,
              align: "left",
              cls: g.tone === "accent" ? "jmt-chip-accent" : "jmt-chip-brand",
              raw: { border_radius_mobile: box(12) },
            }),
            heading(g.title, { tag: "h3", size: "2xl", ls: tracking.tight, color: color.brand900, margin: [20, 0, 0, 0] }),
            iconList(
              g.points.map((p) => ({ text: p, icon: "check" })),
              {
                textColor: color.muted,
                iconColor: color.brand600,
                iconSize: 12,
                iconGap: 10,
                gap: 12,
                iconSelfAlign: "flex-start",
                cls: "jmt-list-2col jmt-check-badges",
                margin: [20, 0, 0, 0],
              },
            ),
          ],
        ),
      ),
    ),
  ]);
}

/* -------------------------------------------------------- how it works */

function howItWorksSection() {
  return section({ y: PY }, [
    sectionHeading({ eyebrow: "How it works", id: "how-h", title: "From request to pickup in four steps", intro: "Send the details once and JMT comes back to you with a quote." }),
    howItWorksSteps(),
  ]);
}

/* ------------------------------------------------------------ vehicles */

function vehiclesSection() {
  return section({ ...navy, y: { d: [96, 96], t: [96, 96], m: [80, 80] } }, [
    container({ width: { d: { unit: "px", size: 672 }, t: { unit: "px", size: 672 }, m: pct(100) }, reveal: 0 }, [
      eyebrowDark("Vehicle options", { plain: true }),
      heading(`The right space for ${gradient("every job")}`, {
        tag: "h2",
        size: { d: "4xl", t: "4xl", m: "3xl" },
        ls: tracking.tight,
        color: color.white,
        margin: [12, 0, 0, 0],
        id: "vehicles-h",
      }),
      text("<p>Four vehicle types, so the job gets the space it needs.</p>", { size: "lg", color: color.brand100_90, margin: [16, 0, 0, 0] }),
    ]),
    container(
      {
        grid: { cols: { d: 4, t: 2, m: 2 }, gap: { d: 20, t: 20, m: 12 } },
        margin: { d: [48, 0, 0, 0], t: [48, 0, 0, 0], m: [32, 0, 0, 0] },
        raw: AUTO_ROWS,
      },
      vehicles.map((v, i) =>
        container(
          {
            border: { width: 1, color: "rgba(255,255,255,0.1)" },
            bg: "rgba(255,255,255,0.04)",
            radius: { d: 24, t: 24, m: 16 },
            pad: { d: 28, t: 28, m: 16 },
            overflow: "hidden",
            reveal: i,
            cls: "jmt-vehicle",
          },
          [
            heading(`0${i + 1}`, {
              tag: "span",
              size: "xs",
              weight: 700,
              ls: tracking.eyebrow,
              transform: "uppercase",
              color: color.brand300,
            }),
            icon(vehicleIcons[v.key], {
              primary: color.accent400,
              size: { d: 48, t: 48, m: 36 },
              align: "left",
              margin: { d: [16, 0, 0, 0], t: [16, 0, 0, 0], m: [12, 0, 0, 0] },
            }),
            heading(v.title, {
              tag: "h3",
              size: { d: "xl", t: "xl", m: "base" },
              color: color.white,
              margin: { d: [20, 0, 0, 0], t: [20, 0, 0, 0], m: [12, 0, 0, 0] },
            }),
            text(`<p>${v.goodFor}</p>`, {
              size: { d: "base", t: "base", m: "sm" },
              color: color.brand100_80,
              margin: { d: [8, 0, 0, 0], t: [8, 0, 0, 0], m: [4, 0, 0, 0] },
            }),
          ],
        ),
      ),
    ),
    container(
      {
        reveal: 0,
        margin: [32, 0, 0, 0],
        border: { width: 1, color: "rgba(246,107,107,0.3)" },
        bg: "rgba(246,107,107,0.1)",
        radius: 24,
        pad: 24,
        dir: { d: "row", t: "row", m: "column" },
        justify: { d: "space-between", t: "space-between", m: "flex-start" },
        align: { d: "center", t: "center", m: "flex-start" },
        gap: 16,
      },
      [
        text(
          `<p><strong style="color:${color.white}">Not sure which vehicle you need?</strong> Choose <em>Not sure</em> on the request form. JMT reviews your items and confirms the right vehicle with your quote.</p>`,
          { color: color.brand50, grow: { d: true, t: true, m: false } },
        ),
        button("Start a request", "/request-a-quote", { widthAuto: true, raw: { _flex_size: "none" } }),
      ],
    ),
  ]);
}

/* -------------------------------------------- service area + why choose */

function areaAndReasons() {
  const area = business.serviceArea;
  return section(
    {
      y: PY,
      grid: { cols: { d: 2, t: 1, m: 1 }, gap: 48 },
      raw: AUTO_ROWS,
    },
    [
      container({}, [
        sectionHeading({ eyebrow: "Service area", id: "area-h", title: "Where we work" }),
        container({ reveal: 0, margin: [24, 0, 0, 0] }, [
          text(
            `<p>${area ? area.summary : "Tell us where the pickup and drop-off are. JMT checks every request against its service area and confirms coverage when it sends your quote."}</p>`,
            { size: "lg", color: color.muted },
          ),
          ...(area?.regions ?? []).flatMap((region) => [
            heading(region.name, { tag: "h3", size: "base", weight: 700, color: color.brand900, margin: [24, 0, 0, 0] }),
            iconList(
              region.places.map((p) => ({ text: p })),
              { inline: true, size: "sm", weight: 500, textColor: color.brand900, cls: "jmt-chips", margin: [12, 0, 0, 0] },
            ),
          ]),
          text(
            `<p>Not sure if we cover your location? Call <a href="${business.phoneHref}">${business.phoneDisplay}</a> or send a request and JMT will let you know.</p>`,
            { color: color.muted, linkColor: color.brand600, cls: "jmt-home-area-note", margin: [20, 0, 0, 0] },
          ),
        ]),
      ]),
      container({}, [
        heading("Why choose JMT", { tag: "h2", size: { d: "4xl", t: "4xl", m: "3xl" }, ls: tracking.tight, color: color.brand900, reveal: 0 }),
        container(
          { gap: 16, margin: [32, 0, 0, 0] },
          reasons.map((r, i) =>
            container(
              { bg: color.white, border: CARD_BORDER, radius: 24, pad: 20, reveal: i, cls: "jmt-card jmt-card-hover" },
              [
                iconBox({
                  icon: "check",
                  title: r.title,
                  desc: r.body,
                  titleTag: "p",
                  position: { d: "left", t: "left", m: "left" },
                  align: { d: "left", t: "left", m: "left" },
                  verticalAlign: "top",
                  ...chip("brand"),
                  iconSize: 20,
                  iconPad: 10,
                  iconRadius: 12,
                  iconGap: 16,
                  titleGap: 0,
                  titleColor: color.brand900,
                  titleSize: "base",
                  titleWeight: 700,
                  descColor: color.muted,
                  descSize: "base",
                  cls: "jmt-chip-brand jmt-chip-grow jmt-chip-noturn",
                }),
              ],
            ),
          ),
        ),
      ]),
    ],
  );
}

/* ----------------------------------------------------------------- FAQ */

function faqSection() {
  return section({ y: PY, bg: color.slate50, inner: width["3xl"] }, [
    sectionHeading({ eyebrow: "FAQ", id: "faq-h", title: "Common questions", center: true }),
    faqAccordion(faqs.slice(0, 4)),
    button("See all FAQs", "/faqs", { variant: "secondary", icon: "arrow-right", align: "center", margin: [32, 0, 0, 0] }),
  ]);
}

/* ---------------------------------------------------------------- page */

export default {
  title: "Home",
  slug: "home",
  front: true,
  seo: {
    title: `Pickup and Delivery for Everyday and Oversized Items | ${business.shortName}`,
    description:
      "JMT Enterprise picks up and delivers Marketplace purchases, furniture, appliances, oversized and fragile items across Denver Metro, Boulder and Northern Colorado. Request a quote.",
  },
  content: () => [
    hero(),
    itemMarquee(),
    servicesSection(),
    whoWeHelp(),
    howItWorksSection(),
    vehiclesSection(),
    areaAndReasons(),
    faqSection(),
    ctaBand(),
  ],
};
