/** /about (src/app/about/page.tsx). */
import { business } from "../../../../src/content/site.ts";
import { ctaBand, pageHero, section } from "../blocks.mjs";
import { container, image, pct, px, text } from "../el.mjs";
import { color, LOGO_URL, width } from "../tokens.mjs";
import { prose } from "./privacy-policy.mjs";

const blocks = [
  [
    "Who we are",
    `${business.name} is a pickup and delivery company serving Denver Metro, Boulder and Northern Colorado. We move the things people and businesses need moved: a sofa bought from a Marketplace seller, a new appliance, an antique cabinet, a few pieces going to a new home, or an order going out to a customer.`,
  ],
  [
    "How we work",
    "Every job starts with a request. You tell us what needs moving, where it is and where it is going. JMT reviews the details, contacts you with a quote and availability, and confirms the service with you before anything is booked.",
  ],
  [
    null,
    "We offer four vehicle types (car, pickup truck, cargo van and box truck) so each job can be matched to the space it needs. If you are not sure which one fits, choose Not sure and we will recommend one.",
  ],
  [
    "What you can expect",
    `A clear quote before anything is booked, one request form for single items or several items and stops, and a direct line to JMT at <a href="${business.phoneHref}">${business.phoneDisplay}</a> or <a href="${business.emailHref}">${business.email}</a> if you have a question.`,
  ],
];

export default {
  title: "About",
  slug: "about",
  seo: {
    title: "About Us | JMT Enterprise",
    description: `About ${business.name}, a pickup and delivery service for individuals and businesses across Denver Metro, Boulder and Northern Colorado.`,
  },
  content: () => [
    pageHero({
      eyebrow: "About",
      title: `About ${business.name}`,
      body: "JMT Enterprise picks up and delivers items for individuals and businesses, from Marketplace purchases and furniture to oversized, fragile and business deliveries.",
    }),
    section({ y: [56, 56], inner: width["5xl"] }, [
      // lg:grid-cols-[1fr_18rem] gap-12 items-start; stacked below lg
      container({ dir: { d: "row", t: "column", m: "column" }, align: "flex-start", gap: 48 }, [
        // width 100% (Elementor default) + flex-shrink fills what the 288px card leaves
        container({}, prose(blocks)),
        container(
          {
            cls: "jmt-card",
            bg: color.white,
            border: { width: 1, color: "rgba(226, 232, 240, 0.8)" },
            radius: 24,
            pad: 32,
            reveal: 0,
            width: { d: { unit: "px", size: 288 }, t: 100, m: 100 },
            raw: { _flex_size: "none", sticky: "top", sticky_on: ["desktop"], sticky_offset: 112, sticky_parent: "yes" },
          },
          [
            image({ url: LOGO_URL, alt: business.name }, { align: "center", raw: { width: pct(100), space: px(224) } }),
            text("<p>Pickup and delivery for individuals and businesses.</p>", {
              size: "sm",
              color: color.muted,
              align: "center",
              margin: [24, 0, 0, 0],
            }),
          ],
        ),
      ]),
    ]),
    ctaBand(),
  ],
};
