/** /services (src/app/services/page.tsx). */
import { services } from "../../../../src/content/site.ts";
import { ctaBand, howItWorksSteps, pageHero, section, sectionHeading } from "../blocks.mjs";
import { button, container, fa, heading, icon, iconList, px, text, tracking } from "../el.mjs";
import { color } from "../tokens.mjs";

/** serviceIcons (lucide) → Font Awesome 5 Free. */
const serviceIcons = {
  "marketplace-pickup": "shopping-bag",
  "furniture-appliance": "couch",
  "heavy-oversized": "weight-hanging",
  "fragile-specialty": "gem",
  "home-to-home": "home",
  "small-business": "building",
  "same-day-scheduled": "calendar-alt",
};

/** .card border: slate-200/80 */
const cardBorder = { width: 1, color: "rgba(226, 232, 240, 0.8)" };

/** Slate-50 panel with an H3 and a check list ("Examples" / "Good to know"). */
const infoPanel = (title, items) =>
  container({ bg: color.slate50, radius: 16, pad: 20 }, [
    heading(title, { tag: "h3", size: "base", weight: 700, color: color.brand900 }),
    iconList(
      items.map((t) => ({ text: t, icon: fa("check") })),
      { iconColor: color.accent600, iconSize: 14, iconGap: 8, gap: 4, textColor: color.muted, margin: [8, 0, 0, 0], iconSelfAlign: "start" },
    ),
  ]);

const serviceCard = (s, i) =>
  container(
    {
      tag: "article",
      id: s.key,
      cls: "jmt-card jmt-card-hover",
      bg: color.white,
      border: cardBorder,
      radius: 24,
      pad: { d: 40, t: 40, m: 24 },
      overflow: "hidden",
      reveal: 0,
    },
    [
      heading(`0${i + 1}`, {
        tag: "span",
        size: { d: "8xl", t: "8xl", m: "7xl" },
        weight: 800,
        color: color.slate100,
        cls: "jmt-bignum",
        absolute: { right: 24, top: 16 },
      }),
      container({ dir: { d: "row", t: "row", m: "column" }, align: "flex-start", gap: 20 }, [
        icon(serviceIcons[s.key], {
          view: "stacked",
          shape: "square",
          primary: color.brand600,
          secondary: color.white,
          size: 28,
          radius: 16,
          align: "left",
          cls: "jmt-chip-brand",
          // icon_padding via raw: el.icon() also copies `pad` into the widget's own _padding
          raw: { icon_padding: px(14), _flex_size: "none" },
        }),
        container({}, [
          heading(s.title, { tag: "h2", size: { d: "3xl", t: "3xl", m: "2xl" }, ls: tracking.tight, color: color.brand900 }),
          text(`<p>${s.short}</p>`, { size: "lg", color: color.muted, margin: [8, 0, 0, 0] }),
          container(
            { grid: { cols: { d: 2, t: 2, m: 1 }, rows: { d: 1, t: 1, m: 2 }, gap: 16 }, margin: [24, 0, 0, 0] },
            [infoPanel("Examples", s.examples), infoPanel("Good to know", s.considerations)],
          ),
          button(`Request a quote<span class="elementor-screen-only"> for ${s.title.toLowerCase()}</span>`, `/request-a-quote?service=${s.key}`, {
            icon: "arrow-right",
            margin: [24, 0, 0, 0],
          }),
        ]),
      ]),
    ],
  );

export default {
  title: "Services",
  slug: "services",
  seo: {
    title: "Pickup and Delivery Services | JMT Enterprise",
    description:
      "Marketplace pickups, furniture and appliance delivery, heavy and oversized items, fragile and antique pieces, home-to-home transport and small-business deliveries.",
  },
  content: () => [
    pageHero({
      eyebrow: "Services",
      title: "Pickup and delivery services",
      body: "JMT transports goods for individuals and businesses. Choose the service closest to your job, or pick Not sure on the form.",
    }),
    section({ y: { d: [80, 80], t: [80, 80], m: [64, 64] }, gap: 24 }, services.map(serviceCard)),
    section({ y: [80, 80], bg: color.slate50, cls: "jmt-dots" }, [
      sectionHeading({
        eyebrow: "Process",
        title: "How it works",
        intro: "Every request is reviewed by JMT before you hear back with a quote.",
        id: "how-h",
      }),
      howItWorksSteps(),
    ]),
    ctaBand(),
  ],
};
