/** Elementor Site Settings (the active Kit): global colours, fonts, theme styles, layout, custom CSS. */
import fs from "node:fs";
import { box, em, px } from "./el.mjs";
import { color, font, width } from "./tokens.mjs";

const typoSet = (prefix, { size, weight, lh, ls, transform }) => ({
  [`${prefix}_typography`]: "custom",
  [`${prefix}_font_family`]: font.family,
  ...(size !== undefined ? { [`${prefix}_font_size`]: px(size) } : {}),
  ...(weight !== undefined ? { [`${prefix}_font_weight`]: String(weight) } : {}),
  ...(lh !== undefined ? { [`${prefix}_line_height`]: em(lh) } : {}),
  ...(ls !== undefined ? { [`${prefix}_letter_spacing`]: em(ls) } : {}),
  ...(transform ? { [`${prefix}_text_transform`]: transform } : {}),
});

/** site.css plus each page's own stylesheet in src/css (alphabetical). */
export function siteCss() {
  const dir = new URL("./css/", import.meta.url);
  const extra = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".css"))
        .sort()
        .map((f) => fs.readFileSync(new URL(f, dir), "utf8"))
    : [];
  return [fs.readFileSync(new URL("./site.css", import.meta.url), "utf8"), ...extra].join("\n");
}

export function kitSettings() {
  return {
    system_colors: [
      { _id: "primary", title: "Primary (Navy)", color: color.brand900.toUpperCase() },
      { _id: "secondary", title: "Secondary (Navy 600)", color: color.brand600.toUpperCase() },
      { _id: "text", title: "Text (Muted)", color: color.muted.toUpperCase() },
      { _id: "accent", title: "Accent (CTA Red)", color: color.accent600.toUpperCase() },
    ],
    custom_colors: [
      ["b00a0c1", "Logo Red", color.accent700],
      ["0717331", "Navy 950", color.brand950],
      ["0b12261", "Ink", color.ink],
      ["eef3fb1", "Brand 50", color.brand50],
      ["dbe5f61", "Brand 100", color.brand100],
      ["b9cbec1", "Brand 200", color.brand200],
      ["8aa6dc1", "Brand 300", color.brand300],
      ["3760ad1", "Brand 500", color.brand500],
      ["173a7a1", "Brand 700", color.brand700],
      ["112f661", "Brand 800", color.brand800],
      ["f66b6b1", "Accent 400", color.accent400],
      ["e23a3a1", "Accent 500", color.accent500],
      ["f8fafc1", "Slate 50", color.slate50],
      ["e2e8f01", "Slate 200", color.slate200],
      ["fffffff", "White", color.white],
    ].map(([_id, title, c]) => ({ _id, title, color: c.toUpperCase() })),
    system_typography: [
      { _id: "primary", title: "Primary (Headings)", ...typoSet("typography", { weight: 800, ls: -0.025 }) },
      { _id: "secondary", title: "Secondary", ...typoSet("typography", { weight: 700 }) },
      { _id: "text", title: "Text", ...typoSet("typography", { size: 16, weight: 400, lh: 1.5 }) },
      { _id: "accent", title: "Accent (Buttons)", ...typoSet("typography", { size: 16, weight: 700 }) },
    ],
    custom_typography: [
      { _id: "eyebrow1", title: "Eyebrow", ...typoSet("typography", { size: 12, weight: 700, ls: 0.14, transform: "uppercase" }) },
      { _id: "lead0001", title: "Lead paragraph", ...typoSet("typography", { size: 18, weight: 400, lh: 1.556 }) },
    ],
    default_generic_fonts: "Sans-serif",

    // Theme Style
    body_background_background: "classic",
    body_background_color: color.white.toUpperCase(),
    body_color: color.ink.toUpperCase(),
    ...typoSet("body_typography", { size: 16, weight: 400, lh: 1.5 }),
    link_normal_color: color.brand700.toUpperCase(),
    link_hover_color: color.brand600.toUpperCase(),
    ...Object.fromEntries(
      [1, 2, 3, 4, 5, 6].flatMap((n) => [
        [`h${n}_color`, color.brand900.toUpperCase()],
        ...Object.entries(typoSet(`h${n}_typography`, { weight: 800, ls: n <= 2 ? -0.025 : undefined })),
      ]),
    ),
    ...typoSet("button_typography", { size: 16, weight: 700, lh: 1.5 }),
    button_text_color: color.white.toUpperCase(),
    button_background_color: color.accent600.toUpperCase(),
    button_hover_text_color: color.white.toUpperCase(),
    button_hover_background_color: color.accent700.toUpperCase(),
    button_border_radius: box(9999),
    button_padding: box(12, 24),
    ...typoSet("form_label_typography", { size: 14, weight: 600, lh: 1.429 }),
    form_label_color: color.ink.toUpperCase(),
    ...typoSet("form_field_typography", { size: 16, weight: 400, lh: 1.5 }),
    form_field_text_color: color.ink.toUpperCase(),
    form_field_background_color: color.white.toUpperCase(),
    form_field_border_border: "solid",
    form_field_border_width: box(1),
    form_field_border_color: color.slate300.toUpperCase(),
    form_field_border_radius: box(12),
    form_field_padding: box(10, 16),
    form_field_focus_border_border: "solid",
    form_field_focus_border_width: box(1),
    form_field_focus_border_color: color.brand500.toUpperCase(),
    image_border_radius: box(0),

    // Site identity
    site_name: "JMT Enterprise LLC",
    site_description: "Pickup and delivery for everyday and oversized items",

    // Layout: 1216px boxed content (max-w-7xl minus gutters), no default gaps
    container_width: px(width.page),
    container_padding: box(0),
    space_between_widgets: { unit: "px", size: 0, column: "0", row: "0", isLinked: true },
    page_title_selector: "h1.entry-title",
    stretched_section_container: "",
    // Hello's default template: theme header/footer slots (filled by the Theme Builder header/footer) and <main id="content">
    default_page_template: "default",
    viewport_mobile: 767,
    viewport_tablet: 1024,
    active_breakpoints: ["viewport_mobile", "viewport_tablet"],

    // Lightbox off for the logo images
    global_image_lightbox: "",

    custom_css: siteCss(),
  };
}
