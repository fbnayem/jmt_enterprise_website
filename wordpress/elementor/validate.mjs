#!/usr/bin/env node
/**
 * Structural audit of the built Elementor export.
 *
 *   node wordpress/elementor/validate.mjs [distDir] [--fa <fa5-free.json>]
 *
 * Checks every template and kit file for: element shape, unique 7-hex ids,
 * known widget types and setting keys (Elementor 3.25+/4.x data names),
 * container options, responsive suffixes, unit objects, colours, Font Awesome 5
 * Free icon names, internal links, form fields and the kit manifest.
 * Exits 1 when any error is found.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { services } from "../../src/content/site.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const faArg = args.indexOf("--fa");
const faFile = faArg > -1 ? args.splice(faArg, 2)[1] : null;
const dist = path.resolve(args[0] ?? path.join(here, "dist"));
const fa = faFile ? JSON.parse(fs.readFileSync(faFile, "utf8")) : null;

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const PAGES = new Set(["/", "/services", "/service-areas", "/about", "/faqs", "/contact", "/request-a-quote", "/request-received", "/privacy-policy", "/service-terms"]);
const SERVICE_KEYS = new Set(services.map((s) => s.key));

/* ------------------------------------------------------------ key allowlists */

const typoKeys = (p) =>
  ["typography", "font_family", "font_size", "font_weight", "line_height", "letter_spacing", "text_transform", "font_style", "text_decoration", "word_spacing"].map(
    (k) => (k === "typography" ? `${p}_typography` : `${p}_${k}`),
  );
const shadowKeys = (p) => [`${p}_box_shadow_type`, `${p}_box_shadow`];

/** Advanced-tab keys every widget accepts. */
const WIDGET_COMMON = new Set([
  "_title",
  "_margin",
  "_padding",
  "_element_id",
  "_css_classes",
  "_element_width",
  "_element_custom_width",
  "_flex_size",
  "_flex_grow",
  "_flex_shrink",
  "_flex_align_self",
  "_flex_order",
  "_flex_order_custom",
  "_position",
  "_offset_orientation_h",
  "_offset_x",
  "_offset_x_end",
  "_offset_orientation_v",
  "_offset_y",
  "_offset_y_end",
  "_z_index",
  "_animation",
  "_animation_delay",
  "animation_duration",
  "_background_background",
  "_background_color",
  "_border_border",
  "_border_width",
  "_border_color",
  "_border_radius",
  ...shadowKeys("_box_shadow"),
  "hide_desktop",
  "hide_tablet",
  "hide_mobile",
  "custom_css",
  "__dynamic__",
  "__globals__",
]);

const CONTAINER_KEYS = new Set([
  "_title",
  "content_width",
  "boxed_width",
  "width",
  "min_height",
  "html_tag",
  "link",
  "container_type",
  "flex_direction",
  "flex_wrap",
  "flex_justify_content",
  "flex_align_items",
  "flex_gap",
  "grid_columns_grid",
  "grid_rows_grid",
  "grid_gaps",
  "grid_auto_flow",
  "grid_justify_items",
  "grid_align_items",
  "padding",
  "margin",
  "background_background",
  "background_color",
  "background_color_b",
  "background_gradient_type",
  "background_gradient_angle",
  "background_color_stop",
  "background_color_b_stop",
  "border_border",
  "border_width",
  "border_color",
  "border_radius",
  ...shadowKeys("box_shadow"),
  "overflow",
  "css_classes",
  "_element_id",
  "animation",
  "animation_delay",
  "animation_duration",
  "hide_desktop",
  "hide_tablet",
  "hide_mobile",
  "sticky",
  "sticky_on",
  "sticky_offset",
  "sticky_effects_offset",
  "sticky_parent",
  "z_index",
  "_flex_size",
  "_flex_grow",
  "_flex_shrink",
  "_flex_align_self",
  "_flex_order",
  "_flex_order_custom",
  "custom_css",
  "__globals__",
  "__dynamic__",
]);

const WIDGET_KEYS = {
  heading: ["title", "header_size", "title_color", "align", "link", "size", ...typoKeys("typography"), "blend_mode"],
  "text-editor": ["editor", "text_color", "align", "link_color", "link_hover_color", "paragraph_spacing", ...typoKeys("typography"), "drop_cap", "text_columns"],
  button: [
    "text",
    "link",
    "size",
    "button_type",
    "selected_icon",
    "icon_align",
    "icon_indent",
    "align",
    "button_text_color",
    "background_background",
    "background_color",
    "background_color_b",
    "background_gradient_type",
    "background_gradient_angle",
    "hover_color",
    "button_background_hover_color",
    "button_hover_border_color",
    "hover_animation",
    "border_border",
    "border_width",
    "border_color",
    "border_radius",
    "text_padding",
    "button_css_id",
    ...typoKeys("typography"),
    ...shadowKeys("button_box_shadow"),
  ],
  icon: ["selected_icon", "view", "shape", "link", "align", "primary_color", "secondary_color", "hover_primary_color", "hover_secondary_color", "size", "icon_padding", "rotate", "border_width", "border_radius", "hover_animation"],
  "icon-box": [
    "selected_icon",
    "view",
    "shape",
    "title_text",
    "description_text",
    "link",
    "position",
    "title_size",
    "primary_color",
    "secondary_color",
    "hover_primary_color",
    "hover_secondary_color",
    "icon_space",
    "icon_size",
    "icon_padding",
    "rotate",
    "border_width",
    "border_radius",
    "text_align",
    "content_vertical_alignment",
    "title_bottom_space",
    "title_color",
    "description_color",
    ...typoKeys("title_typography"),
    ...typoKeys("description_typography"),
  ],
  "icon-list": [
    "view",
    "icon_list",
    "space_between",
    "icon_align",
    "divider",
    "icon_color",
    "icon_color_hover",
    "icon_size",
    "text_indent",
    "icon_self_align",
    "icon_self_vertical_align",
    "text_color",
    "text_color_hover",
    "link_click",
    ...typoKeys("icon_typography"),
  ],
  image: ["image", "image_size", "image_custom_dimension", "align", "caption_source", "link_to", "link", "open_lightbox", "width", "space", "height", "object-fit", "opacity", "image_border_radius"],
  html: ["html"],
  spacer: ["space"],
  "nested-accordion": [
    "items",
    "accordion_item_title_position_horizontal",
    "accordion_item_title_icon_position",
    "accordion_item_title_icon",
    "accordion_item_title_icon_active",
    "title_tag",
    "faq_schema",
    "default_state",
    "max_items_expended",
    "n_accordion_animation_duration",
    "accordion_item_title_space_between",
    "accordion_item_title_distance_from_content",
    "accordion_background_normal_background",
    "accordion_background_normal_color",
    "accordion_border_normal_border",
    "accordion_border_normal_width",
    "accordion_border_normal_color",
    "accordion_border_radius",
    "accordion_padding",
    ...typoKeys("title_typography"),
    "normal_title_color",
    "hover_title_color",
    "active_title_color",
    "icon_size",
    "icon_spacing",
    "normal_icon_color",
    "hover_icon_color",
    "active_icon_color",
    "content_background_background",
    "content_background_color",
    "content_border_border",
    "content_border_width",
    "content_border_color",
    "content_border_radius",
    "content_padding",
  ],
  "nav-menu": [
    "menu",
    "layout",
    "align_items",
    "pointer",
    "animation_line",
    "animation_framed",
    "animation_background",
    "animation_text",
    "submenu_icon",
    "dropdown",
    "full_width",
    "text_align",
    "toggle",
    "toggle_icon_normal",
    "toggle_icon_active",
    "toggle_align",
    ...typoKeys("menu_typography"),
    "color_menu_item",
    "color_menu_item_hover",
    "color_menu_item_active",
    "pointer_color_menu_item_hover",
    "pointer_color_menu_item_active",
    "pointer_width",
    "padding_horizontal_menu_item",
    "padding_vertical_menu_item",
    "menu_space_between",
    "color_dropdown_item",
    "background_color_dropdown_item",
    "color_dropdown_item_hover",
    "background_color_dropdown_item_hover",
    "color_dropdown_item_active",
    "background_color_dropdown_item_active",
    ...typoKeys("dropdown_typography"),
    "padding_horizontal_dropdown_item",
    "padding_vertical_dropdown_item",
    "dropdown_top_distance",
    "toggle_color",
    "toggle_background_color",
    "toggle_size",
    "toggle_border_width",
    "toggle_border_radius",
    "menu_name",
  ],
  form: null, // checked separately (large surface)
};

const BREAKPOINT_SUFFIX = /_(tablet|mobile|laptop|tablet_extra|mobile_extra|widescreen)$/;
const baseKey = (k) => (/^hide_/.test(k) ? k : k.replace(BREAKPOINT_SUFFIX, ""));

/* --------------------------------------------------------------- checks */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;
const isColorKey = (k) => /(^|_)color(_b)?$/.test(baseKey(k)) && !/_stop$/.test(k);

function checkUnitObject(where, k, v) {
  if (typeof v !== "object" || v === null) return;
  if ("unit" in v && "top" in v) {
    for (const side of ["top", "right", "bottom", "left"]) if (typeof v[side] !== "string") err(where, `${k}.${side} must be a string`);
    if (typeof v.isLinked !== "boolean") err(where, `${k}.isLinked must be boolean`);
  } else if ("unit" in v && "size" in v) {
    if (v.size !== "" && typeof v.size !== "number") err(where, `${k}.size must be a number or ""`);
  }
}

function checkIcon(where, k, v) {
  if (!v || typeof v !== "object" || !("value" in v)) return;
  if (v.value === "" && v.library === "") return;
  const m = /^(fas|far|fab) fa-([a-z0-9-]+)$/.exec(v.value);
  if (!m) return err(where, `${k} icon value "${v.value}" is not "fas fa-name"`);
  const style = { fas: "solid", far: "regular", fab: "brands" }[m[1]];
  const lib = { solid: "fa-solid", regular: "fa-regular", brands: "fa-brands" }[style];
  if (v.library !== lib) err(where, `${k} library "${v.library}" should be "${lib}"`);
  if (fa && !fa[style].includes(m[2])) err(where, `${k} "${m[2]}" is not a Font Awesome 5 Free ${style} icon`);
}

function checkLink(where, k, v) {
  if (!v || typeof v !== "object" || !("url" in v)) return;
  const url = v.url;
  if (!url) return err(where, `${k} has an empty url`);
  if (/^(tel:\+1\d{10}|mailto:[^@\s]+@[^@\s]+)$/.test(url)) return;
  if (/^https:\/\//.test(url)) return;
  const m = /^(\/[a-z0-9-]*)(\?service=([a-z-]+))?(#([a-z-]+))?$/.exec(url);
  if (!m) return err(where, `${k} url "${url}" is not a recognised internal link`);
  if (!PAGES.has(m[1])) err(where, `${k} url "${url}" points to an unknown page`);
  if (m[3] && !SERVICE_KEYS.has(m[3])) err(where, `${k} service "${m[3]}" unknown`);
  if (m[5] && m[1] === "/services" && !SERVICE_KEYS.has(m[5])) err(where, `${k} anchor "#${m[5]}" unknown`);
  for (const f of ["is_external", "nofollow"]) if (!(f in v)) warn(where, `${k} missing ${f}`);
}

const FORM_FIELD_TYPES = new Set(["text", "email", "textarea", "url", "tel", "radio", "select", "checkbox", "acceptance", "number", "date", "time", "upload", "password", "html", "hidden", "honeypot", "step", "recaptcha", "recaptcha_v3"]);

function checkForm(where, s) {
  const fields = s.form_fields ?? [];
  if (!fields.length) err(where, "form has no fields");
  const ids = new Set();
  let steps = 0;
  for (const f of fields) {
    const t = f.field_type ?? "text";
    const fw = `${where} field "${f.custom_id}"`;
    if (!FORM_FIELD_TYPES.has(t)) err(fw, `unknown field_type ${t}`);
    if (!/^[a-z0-9_]+$/.test(f.custom_id ?? "")) err(fw, "custom_id must be lowercase letters, digits, underscores");
    if (ids.has(f.custom_id)) err(fw, "duplicate custom_id");
    ids.add(f.custom_id);
    if (!f._id) err(fw, "missing _id");
    if (t === "step") steps++;
    if (["select", "radio", "checkbox"].includes(t) && !f.field_options) err(fw, "options field without field_options");
    if (t === "acceptance" && !f.acceptance_text) err(fw, "acceptance without acceptance_text");
    if (t === "html" && !f.field_html) err(fw, "html field without field_html");
    if (t !== "step" && t !== "html" && t !== "honeypot" && t !== "hidden" && !f.field_label) warn(fw, "no field_label");
    if (f.required && f.required !== "true" && f.required !== "yes") err(fw, `required should be "true", got ${f.required}`);
    for (const w of ["width", "width_tablet", "width_mobile"]) if (f[w] && !["", "100", "80", "75", "70", "66", "60", "50", "40", "33", "30", "25", "20"].includes(f[w])) err(fw, `${w} "${f[w]}" not an allowed width`);
  }
  if (steps && (fields[0].field_type ?? "text") !== "step") err(where, "multi-step form must start with a step field");
  const actions = s.submit_actions ?? [];
  const known = new Set(["save-to-database", "email", "email2", "redirect", "webhook", "mailchimp", "activecampaign", "getresponse", "convertkit", "mailerlite", "drip", "slack", "discord", "popup", "collect_submissions"]);
  for (const a of actions) if (!known.has(a)) err(where, `unknown submit action ${a}`);
  if (actions.includes("email") && !s.email_to) err(where, "email action without email_to");
  if (actions.includes("email2") && !s.email_to_2) err(where, "email2 action without email_to_2");
  if (actions.includes("redirect")) checkLink(where, "redirect_to", { url: s.redirect_to, is_external: "", nofollow: "" });
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === "string") {
      for (const m of v.matchAll(/\[field id="([^"]+)"\]/g)) if (!ids.has(m[1])) err(where, `${k} references unknown field id "${m[1]}"`);
    }
  }
}

function walk(doc, el, depth, ids, ctx) {
  const where = `${doc} › ${el.elType}${el.widgetType ? ":" + el.widgetType : ""}#${el.id}`;
  if (!/^[0-9a-f]{7}$/.test(el.id ?? "")) err(where, "id must be 7 lowercase hex chars");
  if (ids.has(el.id)) err(where, "duplicate id");
  ids.add(el.id);
  if (!Array.isArray(el.elements)) err(where, "elements must be an array");
  if (typeof el.settings !== "object" || Array.isArray(el.settings)) err(where, "settings must be an object");
  const s = el.settings ?? {};

  if (el.elType === "container") {
    if (el.isInner !== depth > 0) err(where, `isInner should be ${depth > 0}`);
    for (const k of Object.keys(s)) if (!CONTAINER_KEYS.has(baseKey(k))) err(where, `unknown container setting ${k}`);
    if (s.html_tag && !["div", "header", "footer", "main", "article", "section", "aside", "nav", "a"].includes(s.html_tag)) err(where, `html_tag ${s.html_tag} not allowed`);
    if (s.html_tag === "a" && !s.link?.url) err(where, "a-tag container without link");
    if (!["boxed", "full"].includes(s.content_width)) err(where, "content_width must be boxed|full");
    if (s.content_width === "boxed" && depth > 0) warn(where, "boxed container nested inside another container");
    if (!["flex", "grid"].includes(s.container_type)) err(where, "container_type must be flex|grid");
    for (const [k, v] of Object.entries(s)) {
      if (baseKey(k) === "flex_direction" && !["row", "column", "row-reverse", "column-reverse"].includes(v)) err(where, `${k}=${v}`);
      if (baseKey(k) === "flex_justify_content" && !["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"].includes(v)) err(where, `${k}=${v}`);
      if (baseKey(k) === "flex_align_items" && !["flex-start", "center", "flex-end", "stretch"].includes(v)) err(where, `${k}=${v}`);
    }
    if (ctx.parentGrid && s.css_classes?.includes("jmt-span-2") && !ctx.parentGrid) err(where, "span class outside grid");
  } else if (el.elType === "widget") {
    if (!el.widgetType) err(where, "widget without widgetType");
    if (!(el.widgetType in WIDGET_KEYS)) err(where, `unexpected widget type ${el.widgetType}`);
    const allowed = WIDGET_KEYS[el.widgetType];
    if (allowed) {
      const set = new Set(allowed);
      for (const k of Object.keys(s)) if (!set.has(baseKey(k)) && !WIDGET_COMMON.has(baseKey(k))) err(where, `unknown ${el.widgetType} setting ${k}`);
    }
    if (el.widgetType === "form") checkForm(where, s);
    if (el.widgetType === "nested-accordion") {
      if ((s.items ?? []).length !== el.elements.length) err(where, "nested accordion items/children count mismatch");
      for (const c of el.elements) if (c.elType !== "container") err(where, "accordion child must be a container");
    } else if (el.elements.length) err(where, "widget must not have children");
    if (el.widgetType === "heading" && !s.title) err(where, "heading without title");
    if (el.widgetType === "text-editor" && !s.editor) err(where, "text editor without content");
    if (el.widgetType === "button" && !s.text) err(where, "button without text");
    if (el.widgetType === "heading" && !["h1", "h2", "h3", "h4", "h5", "h6", "div", "span", "p"].includes(s.header_size)) err(where, `header_size ${s.header_size}`);
    if (el.widgetType === "heading" && s.header_size === "h1") ctx.counts.h1++;
    if (el.widgetType === "image" && !/^https:\/\//.test(s.image?.url ?? "")) err(where, "image url must be absolute https so Elementor can import it");
  } else err(where, `bad elType ${el.elType}`);

  for (const [k, v] of Object.entries(s)) {
    checkUnitObject(where, k, v);
    if (/icon/.test(k)) checkIcon(where, k, v);
    if (baseKey(k) === "link" || k === "link") checkLink(where, k, v);
    if (isColorKey(k) && typeof v === "string" && v && !HEX.test(v) && !RGBA.test(v.replace(/\s/g, ""))) err(where, `${k} "${v}" is not a colour`);
    if (/_font_family$/.test(k) && v !== "Plus Jakarta Sans") warn(where, `${k} is ${v}`);
    if (/_font_weight$/.test(k) && typeof v !== "string") err(where, `${k} must be a string`);
    if (Array.isArray(v) && v.length && typeof v[0] === "object") {
      for (const row of v) {
        if (!row._id && k !== "sticky_on") err(where, `${k} row without _id`);
        for (const [rk, rv] of Object.entries(row)) {
          if (/icon/.test(rk)) checkIcon(where, `${k}[].${rk}`, rv);
          if (rk === "link") checkLink(where, `${k}[].link`, rv);
        }
      }
    }
    if (typeof v === "string" && /href="([^"]+)"/.test(v)) {
      for (const m of v.matchAll(/href="([^"]+)"/g)) checkLink(where, `${k} <a>`, { url: m[1], is_external: "", nofollow: "" });
    }
    if (typeof v === "string" && /\{\{|undefined|\[object Object\]|NaN/.test(v)) err(where, `${k} contains a template/undefined artefact: ${v.slice(0, 80)}`);
  }
  for (const c of el.elements ?? []) walk(doc, c, depth + 1, ids, Object.assign(Object.create(ctx), { parentGrid: s.container_type === "grid" }));
}

function checkDoc(name, content) {
  if (!Array.isArray(content) || !content.length) return err(name, "empty content");
  const ids = new Set();
  const ctx = { counts: { h1: 0 } };
  for (const el of content) {
    if (el.elType !== "container") err(name, "top-level element must be a container");
    walk(name, el, 0, ids, ctx);
  }
  return ctx;
}

/* ---------------------------------------------------------------- run */

const tplDir = path.join(dist, "templates");
for (const f of fs.readdirSync(tplDir).sort()) {
  const doc = JSON.parse(fs.readFileSync(path.join(tplDir, f), "utf8"));
  for (const k of ["content", "page_settings", "version", "title", "type"]) if (!(k in doc)) err(f, `missing ${k}`);
  if (!["page", "header", "footer", "error-404", "container", "section"].includes(doc.type)) err(f, `type ${doc.type}`);
  const ctx = checkDoc(f, doc.content);
  if (doc.type === "page" && ctx && ctx.counts.h1 !== 1) err(f, `page has ${ctx.counts.h1} H1 headings (expected 1)`);
  if (doc.type === "page" && doc.page_settings.template !== "elementor_header_footer") err(f, "page template should be elementor_header_footer");
}

// Kit
const kitZip = path.join(dist, "jmt-enterprise-elementor-kit.zip");
if (!fs.existsSync(kitZip)) err("kit", "zip missing");
const kit = path.join(dist, "kit");
const manifest = JSON.parse(fs.readFileSync(path.join(kit, "manifest.json"), "utf8"));
for (const k of ["name", "title", "version", "elementor_version", "created", "site-settings", "templates", "content", "plugins"]) if (!(k in manifest)) err("manifest", `missing ${k}`);
let fronts = 0;
const slugs = new Set();
for (const [id, p] of Object.entries(manifest.content.page)) {
  const file = path.join(kit, "content", "page", `${id}.json`);
  if (!fs.existsSync(file)) err("manifest", `page ${id} has no file`);
  else {
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!d.content || !d.settings) err(`content/page/${id}.json`, "needs content + settings");
    checkDoc(`kit page ${id} (${p.title})`, d.content);
  }
  if (p.show_on_front) fronts++;
  if (p.doc_type !== "wp-page") err("manifest", `page ${id} doc_type ${p.doc_type}`);
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  slugs.add(slug);
}
if (fronts !== 1) err("manifest", `${fronts} front pages (expected 1)`);
for (const want of ["services", "service-areas", "about", "faqs", "contact", "request-a-quote", "request-received", "privacy-policy", "service-terms"]) {
  if (!slugs.has(want)) err("manifest", `no page whose title slugifies to "${want}" (WordPress derives the URL from the title)`);
}
for (const [id, t] of Object.entries(manifest.templates)) {
  if (!fs.existsSync(path.join(kit, "templates", `${id}.json`))) err("manifest", `template ${id} has no file`);
  if (["header", "footer", "error-404"].includes(t.doc_type) && !t.conditions?.length) err("manifest", `template ${t.title} has no display conditions`);
}
const ss = JSON.parse(fs.readFileSync(path.join(kit, "site-settings.json"), "utf8")).settings;
for (const k of ["system_colors", "custom_colors", "system_typography", "custom_css", "container_width"]) if (!(k in ss)) err("site-settings", `missing ${k}`);
for (const c of [...ss.system_colors, ...ss.custom_colors]) if (!HEX.test(c.color)) err("site-settings", `colour ${c.title} ${c.color}`);

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
