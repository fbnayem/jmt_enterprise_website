/** /service-areas (src/app/service-areas/page.tsx). */
import { business } from "../../../../src/content/site.ts";
import { ctaBand, pageHero, section } from "../blocks.mjs";
import { container, heading, iconList, text } from "../el.mjs";
import { color, width } from "../tokens.mjs";

const area = business.serviceArea;

const coverage = area
  ? [
      text(`<p>${area.summary}</p>`, { size: "lg", color: color.muted }),
      ...area.regions.map((region) =>
        container({ reveal: 0 }, [
          heading(region.name, { tag: "h2", size: "xl", weight: 700, color: color.brand900 }),
          iconList(
            region.places.map((p) => ({ text: p })),
            { cls: "jmt-tiles", weight: 500, textColor: color.brand900, margin: [16, 0, 0, 0] },
          ),
        ]),
      ),
    ]
  : [
      text(
        "<p>JMT provides pickup and delivery within its service area. Every request is checked against our service area, and we confirm whether your pickup and drop-off locations are covered when we send your quote.</p>",
        { size: "lg", color: color.muted },
      ),
    ];

export default {
  title: "Service Areas",
  slug: "service-areas",
  seo: {
    title: "Service Areas | JMT Enterprise",
    description:
      "JMT Enterprise picks up and delivers across Denver Metro, Boulder and Northern Colorado, including Denver, Aurora, Lakewood, Boulder, Longmont, Fort Collins and Greeley.",
  },
  content: () => [
    pageHero({ eyebrow: "Service areas", title: "Where we pick up and deliver", body: "Denver Metro, Boulder and Northern Colorado." }),
    section({ y: [56, 56], inner: width["3xl"], gap: 32 }, [
      ...coverage,
      container(
        {
          cls: "jmt-card",
          bg: color.white,
          border: { width: 1, color: "rgba(226, 232, 240, 0.8)" },
          radius: 24,
          pad: 24,
          reveal: 0,
        },
        [
          heading("Not sure if we cover your location?", { tag: "h2", size: "xl", weight: 700, color: color.brand900 }),
          text(
            `<p>Call <a href="${business.phoneHref}">${business.phoneDisplay}</a>, email <a href="${business.emailHref}">${business.email}</a>, or send a quote request with both addresses. JMT will review it and let you know.</p>`,
            { color: color.muted, cls: "jmt-prose", margin: [8, 0, 0, 0] },
          ),
        ],
      ),
    ]),
    ctaBand(),
  ],
};
