/** /privacy-policy (src/app/privacy-policy/page.tsx). Reference example for page modules. */
import { business, pendingContent } from "../../../../src/content/site.ts";
import { pageHero, section } from "../blocks.mjs";
import { container, heading, text } from "../el.mjs";
import { color, width } from "../tokens.mjs";

const mail = `<a href="${business.emailHref}">${business.email}</a>`;
const tel = `<a href="${business.phoneHref}">${business.phoneDisplay}</a>`;

/** Prose sections: [h2 or null, paragraph HTML]. Copy is verbatim from the Next.js page. */
const blocks = [
  [
    null,
    `This page explains what ${business.name} does with the information you send through this website. If you have a question about your information, or would like it corrected or deleted, email ${mail} or call ${tel}.`,
  ],
  [
    "What we collect",
    "When you request a quote we collect your name, phone number, email address, pickup and drop-off addresses, item details and any item photos you choose to add. We use this information to review your request, prepare a quote and contact you about the service.",
  ],
  [
    "How it is stored",
    "Requests are kept in a private database and photos in private storage. Our staff open photos through links that expire. Location details embedded in photos are removed when they are uploaded.",
  ],
  [
    "Emails",
    "Your request is emailed to JMT so we can review it, and you receive a confirmation email that we have it. These emails are sent through an email delivery provider.",
  ],
  [
    "Who we share it with",
    "We do not sell your information or share it for advertising. It is handled only by the service providers that run this website for us (hosting, the database and photo storage, and email delivery), and only so they can provide that service.",
  ],
  [
    "Analytics and cookies",
    "If analytics are switched on, they count page visits and form steps only. Your name, contact details, addresses, photos and messages are never sent to analytics, and advertising features are off. Analytics use cookies to tell visits apart. The quote form saves your progress in your own browser so you can pick up where you left off.",
  ],
  [
    "Your choices",
    `You can ask us what information we hold about you, or ask us to correct or delete it, by emailing ${mail}. You do not need to send photos to request a quote.`,
  ],
  ["Changes to this policy", "If we change how we handle your information, we will update this page."],
];

/**
 * Prose body: Heading (H2, .prose-page h2: 20px/800 navy, 32px above / 12px below)
 * + Text Editor (muted, 1.75 line height, 16px paragraph gap).
 */
export function prose(items) {
  return items.flatMap(([h, p], i) => [
    h &&
      heading(h, {
        tag: "h2",
        size: "xl",
        color: color.brand900,
        margin: [i === 0 ? 0 : 32, 0, 12, 0],
      }),
    text(`<p>${p}</p>`, { color: color.muted, lh: 1.75, cls: "jmt-prose", margin: [0, 0, 16, 0] }),
  ]);
}

export default {
  title: "Privacy Policy",
  slug: "privacy-policy",
  seo: {
    title: "Privacy Policy | JMT Enterprise",
    description: `How ${business.name} collects and uses the information in quote requests.`,
    noindex: pendingContent.privacyPolicy,
  },
  content: () => [
    pageHero({ eyebrow: "Policy", title: "Privacy Policy" }),
    section({ y: [56, 56], inner: width["3xl"] }, [container({}, prose(blocks))]),
  ],
};
