/**
 * /request-received (src/app/request-received/page.tsx), production rendering.
 * WordPress has no request reference, so the no-reference branch is used with
 * wording that does not promise one.
 */
import { business } from "../../../../src/content/site.ts";
import { section } from "../blocks.mjs";
import { button, container, heading, icon, text, tracking } from "../el.mjs";
import { color, width } from "../tokens.mjs";

const tel = `<a class="jmt-quote-link" href="${business.phoneHref}">${business.phoneDisplay}</a>`;

export default {
  title: "Request Received",
  slug: "request-received",
  seo: { title: "Request Received | JMT Enterprise", noindex: true },
  pageSettings: { custom_css: ".jmt-mobile-bar{display:none !important}" },
  content: () => [
    section({ cls: "jmt-dots", y: { d: [96, 96], t: [96, 96], m: [64, 64] }, inner: width["2xl"] }, [
      icon("check-circle", {
        view: "stacked",
        shape: "circle",
        primary: color.emerald600,
        secondary: color.white,
        size: 40,
        pad: 20,
        align: "center",
        cls: "jmt-success jmt-pulse",
      }),
      heading("Thank you. Your quote request has been received.", {
        tag: "h1",
        size: { d: "4xl", t: "4xl", m: "3xl" },
        ls: tracking.tight,
        color: color.brand900,
        align: "center",
        margin: [24, 0, 0, 0],
      }),
      text("<p>We have emailed you a copy of your request.</p>", {
        size: "lg",
        color: color.muted,
        align: "center",
        margin: [16, 0, 0, 0],
      }),
      text(
        `<p>${business.shortName} will review your details and contact you with a quote and availability. Your pickup or delivery is confirmed only after JMT agrees the service with you.</p>`,
        { size: "lg", color: color.muted, align: "center", margin: [16, 0, 0, 0] },
      ),
      container(
        {
          cls: "jmt-card",
          bg: color.white,
          radius: 24,
          border: { width: 1, color: "rgba(226,232,240,0.8)" },
          pad: { d: 32, t: 32, m: 24 },
          margin: [40, 0, 0, 0],
          align: "stretch",
        },
        [
          heading("What happens next", { tag: "h2", size: "base", weight: 700, color: color.brand900 }),
          text(
            [
              '<ol class="jmt-quote-steps">',
              "<li>We email you a receipt of your request. Check your spam folder if it does not arrive.</li>",
              "<li>JMT reviews your request and contacts you with a quote and availability.</li>",
              "<li>Your pickup or delivery is booked only once you and JMT agree the details.</li>",
              "</ol>",
            ].join(""),
            { color: color.muted, margin: [16, 0, 0, 0] },
          ),
          text(`<p>Need to change something? Call ${tel}.</p>`, { color: color.muted, margin: [16, 0, 0, 0] }),
        ],
      ),
      button("Back to home", "/", { variant: "secondary", align: "center", margin: [32, 0, 0, 0] }),
    ]),
  ],
};
