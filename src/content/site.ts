/**
 * Single source of truth for public business details and approved copy.
 *
 * Everything confirmed by the client brief (3 Oct 2026) is a plain value.
 * Anything still awaiting the client is `null` or listed in `pendingContent`,
 * and pages render a visible staging placeholder instead of inventing details.
 * `npm run check:launch` fails while any pending item remains.
 */

export const business = {
  name: "JMT Enterprise LLC",
  shortName: "JMT Enterprise",
  url: "https://jmtenterprise.net",
  phoneDisplay: "720-983-4400",
  phoneHref: "tel:+17209834400",
  phoneE164: "+17209834400",
  email: "support@jmtenterprise.net",
  emailHref: "mailto:support@jmtenterprise.net",
  /** Awaiting client: confirmed hours of operation. */
  hours: null as string | null,
  /** Awaiting client: confirmed cities, ZIP codes and region. */
  serviceArea: null as null | { summary: string; places: string[] },
  /**
   * STAGING DEFAULT, awaiting client confirmation. America/Denver is inferred
   * from the 720 area code only; it is not published as a service area.
   */
  timezone: "America/Denver",
  timezoneLabel: "Mountain Time",
  timezoneConfirmed: false,
} as const;

/** Content the client still has to supply or approve before public launch. */
export const pendingContent = {
  logo: false,
  brandColors: false,
  photos: true,
  serviceArea: true,
  hours: true,
  timezone: true,
  aboutStory: true,
  privacyPolicy: true,
  serviceTerms: true,
  faqApproval: true,
} as const;

export type ServiceKey =
  | "same-day-scheduled"
  | "marketplace-pickup"
  | "home-to-home"
  | "furniture-appliance"
  | "heavy-oversized"
  | "fragile-specialty"
  | "small-business";

export type Service = {
  key: ServiceKey;
  title: string;
  short: string;
  examples: string[];
  considerations: string[];
};

export const services: Service[] = [
  {
    key: "marketplace-pickup",
    title: "Marketplace and personal purchase pickups",
    short:
      "Bought something on Facebook Marketplace or from a private seller? We can pick it up and bring it to you.",
    examples: ["A sofa from a Marketplace seller", "A dresser from a yard sale", "A table bought from a neighbor"],
    considerations: [
      "Share the seller's pickup address and any time they are available.",
      "Photos from the listing help JMT understand the size of the item.",
    ],
  },
  {
    key: "furniture-appliance",
    title: "Furniture and appliance delivery",
    short: "Couches, beds, tables, washers, refrigerators and other household pieces.",
    examples: ["A sectional sofa", "A refrigerator or washer", "A bed frame and mattress"],
    considerations: [
      "Tell us about stairs, elevators and narrow doorways at both locations.",
      "Let us know if you need help loading or unloading.",
    ],
  },
  {
    key: "heavy-oversized",
    title: "Heavy and oversized items",
    short: "Items that will not fit in your own car or need extra hands and space.",
    examples: ["Exercise equipment", "Large shelving units", "Outdoor furniture sets"],
    considerations: [
      "Approximate dimensions and weight help, but you can choose Not sure.",
      "JMT reviews every oversized request before confirming a vehicle.",
    ],
  },
  {
    key: "fragile-specialty",
    title: "Antiques, fragile and specialty items",
    short: "Pieces that need careful handling, such as antiques, mirrors and artwork.",
    examples: ["An antique cabinet", "A large mirror or framed art", "Glass-top furniture"],
    considerations: [
      "Mark the item as fragile and describe any special handling it needs.",
      "Photos help JMT plan how to move the item safely.",
    ],
  },
  {
    key: "home-to-home",
    title: "Home-to-home item transportation",
    short: "Moving a few items between homes, such as to family or a new apartment.",
    examples: ["Furniture going to a family member", "A few pieces for a new apartment", "Items coming out of storage"],
    considerations: [
      "List each item so JMT can suggest the right vehicle.",
      "Add extra stops if items are collected from more than one place.",
    ],
  },
  {
    key: "small-business",
    title: "Small-business deliveries",
    short: "Deliveries for local businesses, from store orders to equipment and supplies.",
    examples: ["A store delivering a customer's purchase", "Office furniture or equipment", "Supplies between business locations"],
    considerations: [
      "Choose Business on the request form and add your company name.",
      "Describe quantities and any loading dock or access details.",
    ],
  },
  {
    key: "same-day-scheduled",
    title: "Same-day and scheduled deliveries",
    short:
      "Need it moved today or on a set date? Request the timing you prefer and JMT will confirm availability.",
    examples: ["A pickup you need done today", "A delivery planned for next weekend", "A recurring business run you want to plan ahead"],
    considerations: [
      "Same-day requests depend on JMT's availability and are confirmed by JMT.",
      "A requested date is a preference until JMT confirms the service with you.",
    ],
  },
];

export const serviceByKey = Object.fromEntries(services.map((s) => [s.key, s])) as Record<ServiceKey, Service>;

export type VehicleKey = "car" | "pickup-truck" | "cargo-van" | "box-truck";

export const vehicles: { key: VehicleKey; title: string; goodFor: string }[] = [
  { key: "car", title: "Car", goodFor: "Small items and boxes that fit in a passenger vehicle." },
  { key: "pickup-truck", title: "Pickup truck", goodFor: "Open-bed loads such as outdoor furniture or bulky single pieces." },
  { key: "cargo-van", title: "Cargo van", goodFor: "Covered transport for furniture, appliances and several items." },
  { key: "box-truck", title: "Box truck", goodFor: "Larger loads and multiple big pieces that need more space." },
];

export const howItWorks = [
  { title: "Send your request", body: "Tell us what needs moving, where it is and where it is going. Add photos if you have them." },
  { title: "Receive JMT's quote", body: "JMT reviews your details and contacts you with a price and availability." },
  { title: "Agree the service", body: "Your pickup or delivery is confirmed only after you and JMT agree the details." },
  { title: "Pickup and delivery", body: "JMT collects your items and delivers them as agreed." },
];

export const reasons = [
  { title: "Individuals and businesses", body: "One request form for households, Marketplace buyers and local businesses." },
  { title: "Four vehicle options", body: "Car, pickup truck, cargo van or box truck, and help choosing if you are not sure." },
  { title: "A quote before anything is booked", body: "JMT reviews every request and sends a quote before confirming the service." },
  { title: "Multiple items and stops", body: "List several items and add extra pickup or drop-off stops in one request." },
];

export type Faq = { q: string; a: string };

/** Draft answers written from the brief. Awaiting client approval (pendingContent.faqApproval). */
export const faqs: Faq[] = [
  {
    q: "What does JMT Enterprise transport?",
    a: "JMT picks up and delivers goods: Marketplace and personal purchases, furniture and appliances, heavy and oversized items, antiques and fragile pieces, items moving between homes, and small-business deliveries.",
  },
  {
    q: "Who do you work with?",
    a: "Both individuals and businesses. Choose Individual or Business on the request form so JMT has the right details.",
  },
  {
    q: "Which vehicle should I choose?",
    a: "Pick the option you think fits, or choose Not sure. JMT reviews every request and will confirm the right vehicle (car, pickup truck, cargo van or box truck) with your quote.",
  },
  {
    q: "Do I need to send photos?",
    a: "Photos are optional but helpful. You can add up to five JPEG, PNG or WebP images to your request, or send the request without them.",
  },
  {
    q: "What if there are stairs, or I need help loading?",
    a: "Tell us about stairs, elevators, parking and whether you need loading help at each location. If you are not sure, choose Not sure. JMT will confirm what is included when it sends your quote.",
  },
  {
    q: "How is the price decided?",
    a: "JMT prices each job after reviewing it. Things that can affect the quote include the items, the locations, the vehicle needed, access such as stairs, loading help, extra stops and timing.",
  },
  {
    q: "Can I book a specific date or same-day delivery?",
    a: "You can request a date, a time of day, or as soon as possible. Requested times are preferences. Same-day requests depend on JMT's availability.",
  },
  {
    q: "When is my pickup or delivery confirmed?",
    a: "Only after JMT reviews your request, sends you a quote and agrees the service with you. Submitting the form or receiving an automatic email does not reserve a vehicle.",
  },
];

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/about", label: "About" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
] as const;
