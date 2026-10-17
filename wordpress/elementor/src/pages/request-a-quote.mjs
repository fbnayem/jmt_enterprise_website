/**
 * /request-a-quote (src/app/request-a-quote/page.tsx + src/components/quote/QuoteForm.tsx).
 *
 * The React wizard becomes an Elementor Pro Form with four Step fields. Things
 * the Pro Form cannot do are mapped to the closest plain field:
 *  - repeating items / extra stops → "Item 1" fields + an "Other items" textarea,
 *    and one "Extra stops" textarea;
 *  - conditional questions (company name, requested date, elevator, drop-off
 *    access) are always shown; the ones the source only asks conditionally are
 *    optional here, except elevator access, which has a "Not needed" option;
 *  - option descriptions are folded into the option label ("Label|value");
 *  - the review summary is dropped (the confirmation email carries [all-fields]).
 */
import { business, services, vehicles } from "../../../../src/content/site.ts";
import { gradient, navy, section } from "../blocks.mjs";
import { box, container, heading, px, rawWidget, text, tracking } from "../el.mjs";
import { color, font, width } from "../tokens.mjs";

/*
 * Copied verbatim from src/lib/quote/options.ts. That module imports through
 * the "@/" path alias, which plain Node cannot resolve, so it is not imported.
 */
const TIME_WINDOWS = [{ label: "Flexible" }, { label: "Morning" }, { label: "Afternoon" }, { label: "Evening" }];
const YES_NO_UNSURE = [{ label: "Yes" }, { label: "No" }, { label: "Not sure" }];
const STAIRS = [{ label: "No stairs" }, { label: "Yes, stairs" }, { label: "Not sure" }];
const ELEVATOR = [{ label: "Elevator available" }, { label: "No elevator" }, { label: "Not needed (ground level)" }, { label: "Not sure" }];
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];
const PHOTO_LIMITS = { maxFiles: 5, maxBytesEach: 10 * 1024 * 1024 };
const ACKNOWLEDGEMENT_TEXT =
  "I understand this is a quote request. My pickup or delivery is confirmed only after JMT Enterprise reviews my request and agrees the service with me.";

/* ------------------------------------------------------------ field helpers */

/** Responsive widths: tablet/desktop as given, always full width on mobile. */
const w = (d, t = d) => ({ width: String(d), width_tablet: String(t), width_mobile: "100" });
const OPT = " (optional)";

const step = (custom_id, label) => ({
  custom_id,
  field_type: "step",
  field_label: label,
  previous_button: "Back",
  next_button: "Continue",
  ...w(100),
});
const legend = (custom_id, title) => ({ custom_id, field_type: "html", field_label: "", field_html: `<h3>${title}</h3>`, ...w(100) });
const hint = (custom_id, html, cls = "") => ({
  custom_id,
  field_type: "html",
  field_label: "",
  field_html: `<p${cls ? ` class="${cls}"` : ""}>${html}</p>`,
  ...w(100),
});
/** Text-like input. opts: type, required, width [d,t], placeholder, value, rows, min, max, cls */
const input = (custom_id, label, o = {}) => ({
  custom_id,
  field_type: o.type ?? "text",
  field_label: o.required ? label : label + OPT,
  ...(o.required ? { required: "true" } : {}),
  ...(o.placeholder ? { placeholder: o.placeholder } : {}),
  ...(o.value !== undefined ? { field_value: o.value } : {}),
  ...(o.rows ? { rows: o.rows } : {}),
  ...(o.min !== undefined ? { field_min: o.min } : {}),
  ...(o.max !== undefined ? { field_max: o.max } : {}),
  ...(o.cls ? { css_classes: o.cls } : {}),
  ...(o.extra ?? {}),
  ...w(...(o.width ?? [100])),
});
/** Radio / select / checkbox with "Label|value" lines. ChoiceGroups are always required in the source. */
const choice = (custom_id, type, label, options, o = {}) => ({
  custom_id,
  field_type: type,
  // Optional selects and radios show "(optional)" like Field; checkbox labels are visually hidden.
  field_label: o.required === false && type !== "checkbox" ? label + OPT : label,
  field_options: options.join("\n"),
  ...(o.required === false ? {} : { required: "true" }),
  ...(o.value !== undefined ? { field_value: o.value } : {}),
  ...(o.cls ? { css_classes: o.cls } : {}),
  ...w(...(o.width ?? [100])),
});
const labels = (list) => list.map((o) => o.label);

/** Street / unit / city / state / ZIP, laid out like AddressFields (sm:grid-cols-6). */
const address = (p) => [
  input(`${p}_street`, "Street address", { required: true, width: [66] }),
  input(`${p}_unit`, "Apt / unit", { width: [33] }),
  input(`${p}_city`, "City", { required: true, width: [50] }),
  // Source default is the empty "–" option, so the visitor must pick a state.
  choice(`${p}_state`, "select", "State", ["–|", ...US_STATES], { width: [25] }),
  input(`${p}_zip`, "ZIP code", { required: true, width: [25] }),
];

/** Stairs / floor / elevator / parking (accessFields). */
const access = (p, { optional = false } = {}) => [
  choice(`${p}_stairs`, "radio", "Are there stairs?", labels(STAIRS), { required: !optional }),
  input(`${p}_floor`, "Floor number", { width: [50] }),
  hint(`${p}_floor_hint`, "Leave blank if not sure."),
  choice(`${p}_elevator`, "radio", "Elevator access", labels(ELEVATOR), { required: !optional }),
  input(`${p}_parking`, "Parking or access restrictions", { type: "textarea", rows: 2 }),
  hint(`${p}_parking_hint`, "For example: narrow driveway, gate code needed, loading dock hours."),
];

const serviceOptions = ["Choose a service|", ...services.map((s) => s.title), "Not sure / something else"];
const vehicleOptions = [...vehicles.map((v) => v.title), "Not sure"];

const fields = [
  /* ---- Step 1 */
  step("step_pickup", "Pickup and delivery"),
  choice("service_type", "select", "What do you need?", serviceOptions),
  choice("customer_type", "radio", "Is this for you or a business?", ["Individual", "Business"]),
  input("company_name", "Company name", { placeholder: "If this is for a business" }),

  legend("pickup_legend", "Pickup address"),
  ...address("pickup"),

  input("extra_stops", "Extra stops", { type: "textarea", rows: 4 }),
  hint(
    "extra_stops_hint",
    "Add up to 3 extra stops. For each stop, say whether it is a pickup or a drop-off, and give the address and any notes for that stop.",
  ),

  legend("dropoff_legend", "Drop-off address"),
  ...address("dropoff"),

  legend("timing_legend", "Requested timing"),
  hint(
    "timing_hint",
    `This is your preference, not a reserved time slot. Times are in ${business.timezoneLabel} (${business.timezone}). JMT confirms availability with your quote.`,
  ),
  choice("date_mode", "radio", "Preferred date", [
    "As soon as possible (Same-day depends on JMT's availability)|As soon as possible",
    "Choose a date",
  ]),
  input("requested_date", "Requested date", { type: "date", width: [50], extra: { use_native_date: "yes" } }),
  hint("requested_date_hint", "Only needed if you chose a date."),
  choice("time_window", "radio", "Requested time of day", labels(TIME_WINDOWS)),

  /* ---- Step 2 */
  step("step_items", "Items and access"),
  legend("item_legend", "Item 1"),
  input("item_description", "What is it?", {
    required: true,
    width: [75],
    placeholder: "For example: 3-seat sofa, washing machine, antique mirror.",
  }),
  input("item_quantity", "Quantity", { type: "number", required: true, width: [25], value: "1", min: 1, max: 999 }),
  choice("item_size_known", "radio", "Do you know the size or weight?", [
    "Not sure (That's fine. Photos or a description help.)|Not sure",
    "Yes, I'll add what I know",
  ], { value: "Not sure" }),
  input("item_length", "Length", { width: [25] }),
  input("item_width", "Width", { width: [25] }),
  input("item_height", "Height", { width: [25] }),
  choice("item_dimension_unit", "select", "Units", ["inches", "feet", "cm"], { required: false, value: "inches", width: [25] }),
  input("item_weight", "Estimated weight", { width: [50] }),
  choice("item_weight_unit", "select", "Units", ["lb", "kg"], { required: false, value: "lb", width: [25] }),
  choice("item_handling", "checkbox", "Item 1 handling", ["Fragile", "Oversized or very heavy"], {
    required: false,
    cls: "jmt-quote-nolabel",
  }),
  input("other_items", "Other items", { type: "textarea", rows: 4 }),
  hint("other_items_hint", "List any other items, one per line, with quantity and size if you know it."),

  choice("vehicle", "radio", "Vehicle preference", vehicleOptions),
  hint("vehicle_hint", "JMT reviews every request and confirms the vehicle with your quote."),
  choice("loading_help", "radio", "Do you need help loading or unloading?", labels(YES_NO_UNSURE)),
  hint("loading_help_hint", "JMT confirms what help is available with your quote."),

  legend("pickup_access_legend", "Access at pickup"),
  ...access("pickup_access"),

  legend("dropoff_access_legend", "Access at drop-off"),
  choice("dropoff_same_access", "checkbox", "Drop-off access", ["Same stairs and elevator access as pickup"], {
    required: false,
    cls: "jmt-quote-nolabel",
  }),
  hint("dropoff_access_hint", "If you ticked this, you can skip the stairs, floor and elevator questions below."),
  ...access("dropoff_access", { optional: true }),

  input("special_instructions", "Special handling instructions", { type: "textarea", rows: 3 }),

  /* ---- Step 3 */
  step("step_photos", "Photos"),
  hint("photos_intro", "Photos are optional, but they help JMT understand your items and prepare an accurate quote.", "jmt-lead"),
  input("photos", "Item photos", {
    type: "upload",
    extra: {
      file_sizes: String(PHOTO_LIMITS.maxBytesEach / 1024 / 1024),
      file_types: "jpg,jpeg,png,webp",
      allow_multiple_upload: "yes",
      max_files: PHOTO_LIMITS.maxFiles,
    },
  }),
  hint("photos_hint", `Up to ${PHOTO_LIMITS.maxFiles} photos, JPEG, PNG or WebP, 10 MB each.`),
  input("photo_notes", "Additional notes", { type: "textarea", rows: 3 }),

  /* ---- Step 4 */
  step("step_contact", "Contact and review"),
  input("name", "Your name", { required: true }),
  input("phone", "Phone", { type: "tel", required: true, width: [50] }),
  input("email", "Email", { type: "email", required: true, width: [50] }),
  choice("preferred_contact", "radio", "How should JMT contact you?", ["Either", "Phone", "Email"], { value: "Either" }),
  {
    custom_id: "acknowledged",
    field_type: "acceptance",
    field_label: "Acknowledgement",
    acceptance_text: ACKNOWLEDGEMENT_TEXT,
    required: "true",
    css_classes: "jmt-quote-nolabel",
    ...w(100),
  },
  hint(
    "privacy_note",
    'We use your details only to review and respond to this request. See our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.',
  ),
  { custom_id: "website", field_type: "honeypot", field_label: "Leave this field empty", ...w(100) },
];

/* ------------------------------------------------------------- form widget */

const field = (name) => `[field id="${name}"]`;
const typoKeys = (prefix, size, weight, lh) => ({
  [`${prefix}_typography`]: "custom",
  [`${prefix}_font_family`]: font.family,
  [`${prefix}_font_size`]: px(size),
  [`${prefix}_font_weight`]: String(weight),
  [`${prefix}_line_height`]: px(lh),
});

const customerEmail = [
  `Hi ${field("name")},`,
  "",
  `Thank you for your quote request. ${business.shortName} will review your details and contact you with a quote and availability.`,
  "",
  "Your pickup or delivery is confirmed only after JMT agrees the service with you. Submitting the form or receiving this email does not reserve a vehicle.",
  "",
  "A copy of your answers:",
  "",
  "[all-fields]",
  "",
  `Need to change something? Call ${business.phoneDisplay} or email ${business.email}.`,
  "",
  business.shortName,
  `${business.phoneDisplay} · ${business.email}`,
].join("\n");

const form = rawWidget(
  "form",
  {
    form_name: "Quote request",
    form_id: "jmt-quote",
    form_fields: fields,
    input_size: "md",
    show_labels: "yes",
    mark_required: "yes",
    label_position: "above",
    button_text: "Send quote request",
    button_size: "md",
    button_width: "100",
    step_next_label: "Continue",
    step_previous_label: "Back",
    step_type: "progress_bar",

    submit_actions: ["save-to-database", "email", "email2", "redirect"],
    // Email to JMT
    email_to: business.email,
    email_subject: `New quote request from ${field("name")}`,
    email_content: "[all-fields]",
    email_from: "noreply@jmtenterprise.net",
    email_from_name: `${business.shortName} website`,
    email_reply_to: field("email"),
    email_content_type: "plain",
    form_metadata: ["date", "time", "page_url", "remote_ip"],
    // Confirmation to the customer
    email_to_2: field("email"),
    email_subject_2: `We received your quote request – ${business.shortName}`,
    email_content_2: customerEmail,
    email_from_2: "noreply@jmtenterprise.net",
    email_from_name_2: business.shortName,
    email_reply_to_2: business.email,
    email_content_type_2: "plain",
    form_metadata_2: [],
    redirect_to: "/request-received",

    custom_messages: "yes",
    success_message: "Thank you. Your quote request has been received.",
    error_message: `Something went wrong. Please try again, or call ${business.phoneDisplay}.`,
    required_field_message: "This field is required.",
    invalid_message: "Please check the highlighted fields.",
    server_message: `We could not send your request. Please try again, or call ${business.phoneDisplay}.`,

    // Layout (space-y-5 between questions, gap-4 between side-by-side fields)
    column_gap: px(16),
    row_gap: px(20),
    // Labels (.field-label: 14px semibold ink, 6px below)
    label_spacing: px(6),
    label_color: color.ink,
    mark_required_color: "#b91c1c",
    ...typoKeys("label_typography", 14, 600, 20),
    // HTML fields (hints)
    html_color: color.muted,
    ...typoKeys("html_typography", 14, 400, 20),
    // Inputs (.field-input: 48px, 12px radius, slate-300 border)
    field_text_color: color.ink,
    ...typoKeys("field_typography", 16, 400, 24),
    field_background_color: color.white,
    field_border_color: color.slate300,
    field_border_width: box(1),
    field_border_radius: box(12),
    // Buttons (.btn-primary pill)
    button_background_color: color.accent600,
    button_background_hover_color: color.accent700,
    button_text_color: color.white,
    button_hover_color: color.white,
    button_border_radius: box(9999),
    button_text_padding: box(12, 24),
    ...typoKeys("button_typography", 16, 700, 24),
    previous_button_background_color: color.white,
    previous_button_text_color: color.brand800,
    previous_button_background_color_hover: color.brand50,
    previous_button_text_color_hover: color.brand800,
    // Progress bar
    step_progress_bar_color: color.brand500,
    step_progress_bar_background_color: color.slate200,
    step_progress_bar_height: px(4),
  },
  { cls: "jmt-quote-form" },
);

/* -------------------------------------------------------------------- page */

const call = `<a class="jmt-quote-call" href="${business.phoneHref}"><i class="fas fa-phone-alt" aria-hidden="true"></i> Call ${business.phoneDisplay}</a>`;

export default {
  title: "Request a Quote",
  slug: "request-a-quote",
  seo: {
    title: "Request a Quote | JMT Enterprise",
    description: "Tell JMT Enterprise what you need picked up and delivered. JMT reviews your request and contacts you with a quote.",
  },
  pageSettings: { custom_css: ".jmt-mobile-bar{display:none !important}" },
  content: () => [
    // Hero: pt-12 sm:pt-16 pb-28, max-w-3xl
    section({ ...navy, y: { d: [64, 112], t: [64, 112], m: [48, 112] }, inner: width["3xl"] }, [
      heading(`Request a ${gradient("quote")}`, {
        tag: "h1",
        size: { d: "5xl", t: "5xl", m: "4xl" },
        ls: tracking.tight,
        color: color.white,
      }),
      text(
        "<p>Four short steps, no account needed. JMT reviews your request and contacts you with a price and availability.</p>",
        { size: "lg", color: color.brand100_90, margin: [16, 0, 0, 0] },
      ),
      text(`<p>Prefer to talk? ${call}</p>`, { color: color.brand200, margin: [16, 0, 0, 0] }),
    ]),
    // Form card overlapping the hero (-mt-20), pb-16, card max-w-3xl (768px)
    section(
      {
        y: [0, 64],
        inner: 768,
        margin: [-80, 0, 0, 0],
        raw: { z_index: 1 },
      },
      [
        container(
          {
            cls: "jmt-card jmt-quote-card",
            bg: color.white,
            radius: 24,
            pad: { d: 40, t: 40, m: 20 },
            border: { width: 1, color: "rgba(226,232,240,0.8)" },
            shadow: { x: 0, y: 30, blur: 80, spread: -30, color: "rgba(7,23,51,0.45)" },
          },
          [form],
        ),
      ],
    ),
  ],
};
