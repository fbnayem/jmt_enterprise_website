/**
 * Shared page blocks, mirroring src/components/sections.tsx so every page
 * uses identical hero, section heading, CTA band, steps and FAQ markup.
 */
import { business, faqs, howItWorks } from "../../../src/content/site.ts";
import { box, button, container, heading, nestedAccordion, px, text, tracking } from "./el.mjs";
import { color, gutter, width } from "./tokens.mjs";

/**
 * Padding with the page gutters. y: { d: [top, bottom], t: [...], m: [...] }
 * or [top, bottom] for all breakpoints.
 */
export function gutterPad(y) {
  const spec = Array.isArray(y) ? { d: y, t: y, m: y } : y;
  const out = {};
  for (const bp of ["d", "t", "m"]) {
    const [top, bottom] = spec[bp] ?? spec.t ?? spec.d;
    const g = gutter[{ d: "desktop", t: "tablet", m: "mobile" }[bp]];
    out[bp] = [top, g, bottom, g];
  }
  return out;
}

/**
 * Top-level page section (container-page). opts.inner = max content width (px),
 * defaults to the 1216px page width. All other container opts pass through.
 */
export function section(opts, children) {
  const { y = [0, 0], inner = width.page, ...rest } = opts;
  return container({ tag: "section", boxed: inner, pad: gutterPad(y), ...rest }, children);
}

/** Navy section background with the animated glow + grid backdrop. */
export const navy = { bg: color.brand950, cls: "jmt-glow" };

/**
 * Dark eyebrow pill (white text on glass), with the red dot unless `plain`.
 * `align` is its own align-self: a width-auto widget still stretches across a column
 * container whose items stretch, so it defaults to flex-start (pass "center" in a centred column).
 */
export function eyebrowDark(label, { ping = false, plain = false, margin, reveal, align = "flex-start" } = {}) {
  return heading(label, {
    tag: "p",
    size: "xs",
    weight: 700,
    lh: 1.333,
    ls: tracking.eyebrow,
    transform: "uppercase",
    color: color.white,
    widthAuto: true,
    alignSelf: align,
    margin,
    reveal,
    cls: ["jmt-eyebrow-dark", ping && "jmt-eyebrow--ping", plain && "jmt-eyebrow--plain"].filter(Boolean).join(" "),
    raw: {
      _background_background: "classic",
      _background_color: "rgba(255,255,255,0.05)",
      _border_border: "solid",
      _border_width: box(1),
      _border_color: "rgba(255,255,255,0.15)",
      _border_radius: box(9999),
      _padding: box(4, 12),
    },
  });
}

/** Light eyebrow pill (.eyebrow). */
export function eyebrowLight(label, { margin, align } = {}) {
  return heading(label, {
    tag: "p",
    size: "xs",
    weight: 700,
    lh: 1.333,
    ls: tracking.eyebrow,
    transform: "uppercase",
    color: color.brand600,
    widthAuto: true,
    margin,
    cls: "jmt-eyebrow",
    raw: {
      _background_background: "classic",
      _background_color: color.brand50,
      _border_border: "solid",
      _border_width: box(1),
      _border_color: color.brand200,
      _border_radius: box(9999),
      _padding: box(4, 12),
      ...(align ? { _flex_align_self: align } : {}),
    },
  });
}

/** Wraps text in the red gradient used for highlighted words. */
export const gradient = (s) => `<span class="jmt-gradient">${s}</span>`;

/** Inner page header (PageHero). body is HTML or plain text. */
export function pageHero({ eyebrow, title, body }) {
  return section({ ...navy, y: { d: [80, 80], t: [80, 80], m: [56, 64] }, inner: width["4xl"] }, [
    eyebrow && eyebrowDark(eyebrow, { margin: [0, 0, 16, 0] }),
    heading(title, {
      tag: "h1",
      size: { d: "5xl", t: "5xl", m: "4xl" },
      ls: tracking.tight,
      color: color.white,
      cls: "jmt-balance",
    }),
    body &&
      text(body.startsWith("<") ? body : `<p>${body}</p>`, {
        size: "lg",
        color: color.brand100_90,
        margin: [16, 0, 0, 0],
        maxWidth: 672,
      }),
  ]);
}

/** SectionHeading: eyebrow pill, H2 and intro, left or centred, revealed on scroll. */
export function sectionHeading({ eyebrow, title, intro, center = false, id }) {
  return container(
    {
      width: { unit: "px", size: 672 },
      align: center ? "center" : "flex-start",
      reveal: 0,
      raw: center ? { _flex_align_self: "center" } : {},
    },
    [
      eyebrow && eyebrowLight(eyebrow),
      heading(title, {
        tag: "h2",
        size: { d: "4xl", t: "4xl", m: "3xl" },
        ls: tracking.tight,
        color: color.brand900,
        align: center ? "center" : undefined,
        margin: [12, 0, 0, 0],
        id,
        cls: "jmt-balance",
      }),
      intro && text(`<p>${intro}</p>`, { size: "lg", color: color.muted, margin: [16, 0, 0, 0], align: center ? "center" : undefined }),
    ],
  );
}

/** Rounded navy call-to-action band (CtaBand). */
export function ctaBand({ title = "Tell us what you need moved" } = {}) {
  return container(
    { tag: "section", boxed: 1280, pad: gutterPad([64, 64]) },
    [
      container(
        {
          ...navy,
          reveal: 0,
          radius: 32,
          pad: { d: [64, 48], t: [64, 48], m: [56, 24] },
          dir: { d: "row", t: "column", m: "column" },
          justify: "space-between",
          align: { d: "center", t: "flex-start", m: "flex-start" },
          gap: 32,
        },
        [
          container({ width: { d: { unit: "px", size: 576 }, t: pct100(), m: pct100() } }, [
            heading(title, { tag: "h2", size: { d: "4xl", t: "4xl", m: "3xl" }, ls: tracking.tight, color: color.white, cls: "jmt-balance" }),
            text("<p>Send your details and JMT will contact you with a quote and availability. No account needed.</p>", {
              size: "lg",
              color: color.brand100_90,
              margin: [12, 0, 0, 0],
            }),
          ]),
          container(
            {
              dir: { d: "row", t: "row", m: "column" },
              gap: 12,
              width: { d: { unit: "px", size: "" }, t: { unit: "px", size: "" }, m: pct100() },
              raw: { _flex_size: "none" },
            },
            [
              button("Request a Quote", "/request-a-quote", { size: "lg", icon: "arrow-right", full: { m: "justify" } }),
              button(business.phoneDisplay, business.phoneHref, {
                variant: "onDark",
                size: "lg",
                icon: "phone-alt",
                iconPos: "left",
                full: { m: "justify" },
              }),
            ],
          ),
        ],
      ),
    ],
  );
}
const pct100 = () => ({ unit: "%", size: 100, sizes: [] });

/** How it works: four numbered steps with a connector line. */
export function howItWorksSteps() {
  return container(
    {
      grid: { cols: { d: 4, t: 4, m: 1 }, rows: { d: 1, t: 1, m: 4 }, gap: 24 },
      cls: "jmt-steps",
      margin: { d: [56, 0, 0, 0], t: [56, 0, 0, 0], m: [40, 0, 0, 0] },
    },
    howItWorks.map((s, i) =>
      container(
        {
          reveal: i,
          dir: { d: "column", t: "column", m: "row" },
          gap: { d: 24, t: 24, m: 20 },
          align: "flex-start",
        },
        [
          heading(String(i + 1), {
            tag: "span",
            size: "lg",
            lh: 1,
            color: color.white,
            cls: `jmt-step-num${i === howItWorks.length - 1 ? " jmt-step-num--last" : ""}`,
            widthAuto: true,
            attrs: { "aria-hidden": "true" }, // the H3 carries "Step n:" for screen readers
            raw: { _flex_size: "none" },
          }),
          container({ gap: 8 }, [
            heading(`<span class="elementor-screen-only">Step ${i + 1}: </span>${s.title}`, {
              tag: "h3",
              size: "lg",
              color: color.brand900,
            }),
            text(`<p>${s.body}</p>`, { color: color.muted }),
          ]),
        ],
      ),
    ),
  );
}

/** FAQ list as a Nested Accordion. */
export function faqAccordion(items = faqs, { faqSchema = false, margin = [40, 0, 0, 0] } = {}) {
  const acc = nestedAccordion(
    items.map((f) => ({
      title: f.q,
      content: text(`<p>${f.a}</p>`, { color: color.muted, lh: 1.625 }),
    })),
    {
      faqSchema,
      cls: "jmt-faq",
      raw: {
        accordion_item_title_space_between: px(12),
        accordion_item_title_distance_from_content: px(12),
        title_typography_typography: "custom",
        title_typography_font_family: "Plus Jakarta Sans",
        title_typography_font_size: px(18),
        title_typography_font_weight: "700",
        title_typography_line_height: { unit: "em", size: 1.556, sizes: [] },
        normal_title_color: color.brand900,
        hover_title_color: color.brand900,
        active_title_color: color.brand900,
        icon_size: px(16),
        normal_icon_color: color.brand600,
        hover_icon_color: color.brand600,
        active_icon_color: color.white,
        _margin: box(...margin),
      },
    },
  );
  return acc;
}
