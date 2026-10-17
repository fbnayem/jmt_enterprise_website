/** /contact (src/app/contact/page.tsx). No CTA band (the source has none). */
import { business } from "../../../../src/content/site.ts";
import { navy, pageHero, section } from "../blocks.mjs";
import { button, container, fa, heading, icon, px, text, tracking } from "../el.mjs";
import { color, width } from "../tokens.mjs";

const card = { cls: "jmt-card", bg: color.white, border: { width: 1, color: "rgba(226, 232, 240, 0.8)" }, radius: 24 };

/** Small uppercase label (text-sm font-bold uppercase tracking-wide text-slate-500). */
const label = (t, tag = "span") =>
  heading(t, { tag, size: "sm", weight: 700, ls: tracking.wide, transform: "uppercase", color: color.slate500 });

/** 48px rounded-2xl icon chip. */
const chip = (name, opts = {}) =>
  icon(typeof name === "string" ? fa(name) : name, {
    view: "stacked",
    shape: "square",
    primary: color.brand600,
    secondary: color.white,
    size: 24,
    radius: 16,
    align: "left",
    // icon_padding via raw: el.icon() also copies `pad` into the widget's own _padding
    raw: { icon_padding: px(12), _flex_size: "none" },
    ...opts,
  });

/** Phone / email card: the whole card is the link. */
const linkCard = (name, title, value, href, valueCls) =>
  container(
    {
      ...card,
      tag: "a",
      link: href,
      cls: "jmt-card jmt-card-hover",
      pad: 24,
      dir: "row",
      gap: 16,
      align: "flex-start",
      reveal: 0,
    },
    [
      chip(name, { cls: "jmt-chip-brand jmt-chip-flat" }),
      container({}, [label(title), heading(value, { tag: "span", size: "xl", weight: 700, color: color.brand900, cls: valueCls })]),
    ],
  );

export default {
  title: "Contact",
  slug: "contact",
  seo: {
    title: "Contact Us | JMT Enterprise",
    description: `Call ${business.phoneDisplay} or email ${business.email}. For a price, send a quote request with your pickup and delivery details.`,
  },
  content: () => [
    pageHero({
      eyebrow: "Contact",
      title: "Contact JMT Enterprise",
      body: "For a price, the quickest way is a quote request with your item and address details.",
    }),
    section({ y: [64, 64], inner: width["4xl"] }, [
      container({ grid: { cols: { d: 2, t: 2, m: 1 }, rows: 1, gap: 24 } }, [
        linkCard("phone-alt", "Call", business.phoneDisplay, business.phoneHref),
        linkCard("envelope", "Email", business.email, business.emailHref, "jmt-contact-break"),
        container({ ...card, cls: "jmt-card jmt-contact-span", pad: 24, dir: "row", gap: 16, align: "flex-start", reveal: 0 }, [
          chip(fa("clock", "fa-regular"), { primary: color.slate100, secondary: color.brand600 }),
          container({}, [
            label(business.hours ? "Hours" : "Scheduling", "h2"),
            text(`<p>${business.hours ?? "Call to schedule, or send a quote request online at any time."}</p>`, {
              size: "lg",
              color: color.brand900,
            }),
          ]),
        ]),
        container({ ...navy, cls: "jmt-glow jmt-contact-span", radius: 24, pad: 32, overflow: "hidden", reveal: 0 }, [
          heading("Need a price?", { tag: "h2", size: "2xl", weight: 800, color: color.white }),
          text("<p>Send your pickup and delivery details and JMT will contact you with a quote and availability.</p>", {
            color: color.brand100_90,
            margin: [8, 0, 0, 0],
          }),
          button("Request a Quote", "/request-a-quote", { margin: [16, 0, 0, 0] }),
        ]),
      ]),
    ]),
  ],
};
