/**
 * Theme Builder › Footer (src/components/Footer.tsx) plus the mobile
 * quick-action bar (MobileActionBar.tsx) and the LocalBusiness JSON-LD
 * from src/app/layout.tsx. Display condition: entire site.
 */
import { business, nav } from "../../../../src/content/site.ts";
import { gutterPad } from "../blocks.mjs";
import { box, button, container, heading, html, iconList, image, link, shadow, text, tracking } from "../el.mjs";
import { color, LOGO_URL, width } from "../tokens.mjs";

const links = [
  { href: "/", label: "Home" },
  ...nav,
  { href: "/request-a-quote", label: "Request a Quote" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/service-terms", label: "Service Terms" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: business.name,
  url: business.url,
  telephone: business.phoneE164,
  email: business.email,
  logo: LOGO_URL,
  description: "Pickup and delivery of everyday and oversized items for individuals and businesses.",
  areaServed: business.serviceArea.regions.flatMap((r) =>
    r.places.map((name) => ({ "@type": "City", name, containedInPlace: { "@type": "State", name: "Colorado" } })),
  ),
};

/** "© {current year} JMT Enterprise LLC. All rights reserved." via the Pro Current Date Time tag. */
const yearTag = () => {
  const settings = {
    date_format: "custom",
    time_format: "",
    custom_format: "Y",
    before: "© ",
    after: ` ${business.name}. All rights reserved.`,
  };
  return `[elementor-tag id="1a2b3c4" name="current-date-time" settings="${encodeURIComponent(JSON.stringify(settings))}"]`;
};

const colHeading = (label) =>
  heading(label, { tag: "h2", size: "xs", weight: 700, lh: 1.333, ls: tracking.eyebrow, transform: "uppercase", color: color.white });

export default {
  name: "footer",
  title: "JMT Footer",
  type: "footer",
  conditions: [{ type: "include", name: "general", sub_name: "", sub_id: "" }],
  content: () => [
    container(
      {
        tag: "footer",
        boxed: width.page,
        bg: color.brand950,
        cls: "jmt-footer",
        pad: gutterPad({ d: [64, 48], t: [64, 112], m: [64, 112] }),
      },
      [
        container({ dir: { d: "row", t: "row", m: "column" }, gap: 48 }, [
          container({ width: { d: 36.27, t: 36.27, m: 100 }, align: "flex-start" }, [
            image(
              { url: LOGO_URL, alt: business.name },
              {
                width: 142,
                link: "/",
                widthAuto: true,
                cls: "jmt-logo-card",
                raw: {
                  _background_background: "classic",
                  _background_color: color.white,
                  _padding: box(12),
                  _border_radius: box(16),
                  ...shadow("_box_shadow", { x: 0, y: 10, blur: 15, spread: -3, color: "rgba(0,0,0,0.2)" }),
                },
              },
            ),
            text(
              "<p>Pickup and delivery for individuals and businesses. Every job is quoted and confirmed by JMT before service.</p>",
              { color: color.brand100_80, margin: [20, 0, 0, 0], maxWidth: 384 },
            ),
            button("Request a Quote", "/request-a-quote", { icon: "arrow-right", margin: [24, 0, 0, 0], cls: "jmt-btn--external", widthAuto: true }),
          ]),
          container({ width: { d: 27.88, t: 27.88, m: 100 }, tag: "nav", attrs: { "aria-label": "Footer" }, raw: { _title: "Footer navigation" } }, [
            colHeading("Pages"),
            iconList(
              links.map((l) => ({ text: l.label, url: l.href })),
              { size: "sm", textColor: color.brand100, textHover: color.accent400, cls: "jmt-footer-links", margin: [16, 0, 0, 0] },
            ),
          ]),
          container({ width: { d: 27.88, t: 27.88, m: 100 } }, [
            colHeading("Contact"),
            iconList(
              [
                { text: business.phoneDisplay, icon: "phone-alt", url: business.phoneHref },
                { text: business.email, icon: "envelope", url: business.emailHref },
              ],
              {
                size: "sm",
                gap: 12,
                textColor: color.brand100,
                textHover: color.white,
                iconColor: color.brand100,
                iconSize: 16,
                cls: "jmt-footer-contact", // 12px gap is the badge's margin in site.css
                margin: [16, 0, 0, 0],
              },
            ),
          ]),
        ]),
        container({ margin: [48, 0, 0, 0], pad: [24, 0, 0, 0], border: { sides: [1, 0, 0, 0], color: "rgba(255,255,255,0.1)" } }, [
          heading(`© 2026 ${business.name}. All rights reserved.`, {
            tag: "p",
            size: "xs",
            weight: 400,
            color: color.brand300,
            raw: { __dynamic__: { title: yearTag() } },
          }),
        ]),
        html(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, { raw: { _title: "LocalBusiness schema" } }),
      ],
    ),
    // Mobile quick actions (hidden on desktop; hidden on the quote and thank-you pages by page CSS)
    container(
      {
        tag: "aside",
        dir: "row",
        gap: 8,
        pad: 6,
        radius: 9999,
        bg: "rgba(255,255,255,0.85)",
        border: { width: 1, color: "rgba(255,255,255,0.6)" },
        shadow: { x: 0, y: 12, blur: 40, spread: -12, color: "rgba(7,23,51,0.45)" },
        cls: "jmt-mobile-bar",
        hide: ["desktop"],
        attrs: { "aria-label": "Quick actions" },
        raw: { _title: "Mobile quick actions" },
      },
      [
        button("Call", { ...link(business.phoneHref), custom_attributes: `aria-label|Call ${business.phoneDisplay}` }, {
          variant: "secondary",
          size: "sm",
          icon: "phone-alt",
          iconPos: "left",
          padY: 10,
          padX: 16,
          cls: "jmt-btn--compact jmt-btn--noshift",
          widthAuto: true,
          raw: { button_box_shadow_box_shadow_type: "" },
        }),
        button("Request a Quote", "/request-a-quote", {
          size: "sm",
          padY: 10,
          full: "justify",
          cls: "jmt-btn--compact",
          grow: true,
        }),
      ],
    ),
  ],
};
