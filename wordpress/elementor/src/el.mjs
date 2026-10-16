/**
 * Builders for Elementor elements (Flexbox Container + classic widgets).
 *
 * Setting keys follow Elementor 3.25+ / 4.x data as stored in `_elementor_data`
 * (checked against a live Elementor 4.3.5 + Pro 4.3.2 site). Every builder
 * returns a plain element object; ids are assigned later by `finalize()` so
 * output is deterministic.
 *
 * Responsive values: most options accept either a single value or
 * `{ d, t, m }` (desktop, tablet ≤1024px, mobile ≤767px). Tailwind's base
 * styles map to mobile, `sm:` to tablet and `lg:` to desktop.
 *
 * Every builder takes `raw` (extra settings merged last) as an escape hatch.
 */
import crypto from "node:crypto";
import { color, font, textSize } from "./tokens.mjs";

/* ------------------------------------------------------------------ units */

export const px = (size) => ({ unit: "px", size, sizes: [] });
export const em = (size) => ({ unit: "em", size, sizes: [] });
export const pct = (size) => ({ unit: "%", size, sizes: [] });
export const deg = (size) => ({ unit: "deg", size, sizes: [] });

/** Dimensions (padding, margin, radius, border width). CSS shorthand order. */
export function box(top, right = top, bottom = top, left = right, unit = "px") {
  return {
    unit,
    top: String(top),
    right: String(right),
    bottom: String(bottom),
    left: String(left),
    isLinked: top === right && right === bottom && bottom === left,
  };
}

const BP = { d: "", t: "_tablet", m: "_mobile" };

/** Is this a {d,t,m} responsive spec? */
const isResp = (v) => v && typeof v === "object" && !Array.isArray(v) && ("d" in v || "t" in v || "m" in v);

/**
 * Responsive setter: resp("padding", {d: box(..), m: box(..)}, x => x)
 * returns { padding, padding_mobile }. Plain values set desktop only
 * (Elementor inherits desktop values down to tablet and mobile).
 */
export function resp(key, value, map = (x) => x) {
  if (value === undefined || value === null) return {};
  if (!isResp(value)) return { [key]: map(value) };
  const out = {};
  for (const [bp, suffix] of Object.entries(BP)) {
    if (value[bp] !== undefined && value[bp] !== null) out[key + suffix] = map(value[bp]);
  }
  return out;
}

/** Accept a number, an array [t,r,b,l] / [v,h] or a box object. */
function toBox(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number") return box(v);
  if (Array.isArray(v)) {
    if (v.length === 2) return box(v[0], v[1], v[0], v[1]);
    if (v.length === 4) return box(v[0], v[1], v[2], v[3]);
    throw new Error(`bad box ${JSON.stringify(v)}`);
  }
  return v;
}

const toPx = (v) => (typeof v === "number" ? px(v) : v);

/* ------------------------------------------------------------- typography */

/**
 * Typography group control. `size` may be a Tailwind key ("lg"), a number
 * (px) or a responsive {d,t,m} of either. Line height follows the Tailwind
 * pair unless `lh` (unitless multiplier, e.g. 1.05) is given.
 */
export function typo(prefix, { size, weight, lh, ls, transform, family = font.family, style } = {}) {
  const out = { [`${prefix}_typography`]: "custom", [`${prefix}_font_family`]: family };
  const sizeOf = (s) => (typeof s === "string" ? textSize[s][0] : s);
  const lhOf = (s) => {
    if (lh !== undefined) return em(lh);
    if (typeof s === "string") return em(+(textSize[s][1] / textSize[s][0]).toFixed(3));
    return undefined;
  };
  if (size !== undefined) {
    Object.assign(out, resp(`${prefix}_font_size`, size, (s) => px(sizeOf(s))));
    const lhSpec = isResp(size) ? Object.fromEntries(Object.entries(size).map(([k, s]) => [k, lhOf(s)])) : lhOf(size);
    if (isResp(lhSpec)) {
      for (const [bp, v] of Object.entries(lhSpec)) if (v) out[`${prefix}_line_height${BP[bp]}`] = v;
    } else if (lhSpec) out[`${prefix}_line_height`] = lhSpec;
  } else if (lh !== undefined) out[`${prefix}_line_height`] = em(lh);
  if (weight !== undefined) out[`${prefix}_font_weight`] = String(weight);
  if (ls !== undefined) out[`${prefix}_letter_spacing`] = typeof ls === "number" ? em(ls) : ls;
  if (transform) out[`${prefix}_text_transform`] = transform;
  if (style) out[`${prefix}_font_style`] = style;
  return out;
}

/** Tailwind tracking presets (em). */
export const tracking = { tight: -0.025, wide: 0.025, wider: 0.05, eyebrow: 0.14 };

/* --------------------------------------------------------------- shadows */

export function shadow(prefix, { x = 0, y = 0, blur = 0, spread = 0, color: c = "rgba(0,0,0,0.1)" }) {
  return {
    [`${prefix}_box_shadow_type`]: "yes",
    [`${prefix}_box_shadow`]: { horizontal: x, vertical: y, blur, spread, color: c },
  };
}

/** Tailwind-ish card shadow used by `.card`. */
export const cardShadow = { x: 0, y: 8, blur: 24, spread: -12, color: "rgba(15,23,42,0.12)" };

/* ------------------------------------------------------------- motion/vis */

/** Entrance animation like the site's scroll reveal (data-reveal, 80ms stagger). */
export function reveal(isContainer, index = 0) {
  const k = isContainer ? "animation" : "_animation";
  const out = { [k]: "fadeInUp" };
  if (index) out[isContainer ? "animation_delay" : "_animation_delay"] = index * 80;
  return out;
}

/** hide: ["desktop","tablet","mobile"] → Elementor responsive visibility. */
export function hide(list = []) {
  const out = {};
  for (const bp of list) out[`hide_${bp}`] = `hidden-${bp}`;
  return out;
}

export const fa = (name, library = "fa-solid") => ({
  value: `${library === "fa-regular" ? "far" : library === "fa-brands" ? "fab" : "fas"} fa-${name}`,
  library,
});

export const link = (url, { external = false, nofollow = false } = {}) => ({
  url,
  is_external: external ? "on" : "",
  nofollow: nofollow ? "on" : "",
  custom_attributes: "",
});

/* -------------------------------------------------------------- container */

/**
 * Flexbox / grid container.
 *
 * opts:
 *  tag        html_tag ("div" default, "section", "header", "footer", "nav", "article", "aside", "a")
 *  boxed      inner max width in px (top-level sections) → content_width boxed. Omit for full.
 *  width      child width {d,t,m} number = %, or {unit,size}
 *  dir        "row" | "column" (responsive)
 *  wrap       true → flex_wrap wrap (responsive allowed)
 *  justify    flex-start|center|flex-end|space-between|space-around|space-evenly (responsive)
 *  align      flex-start|center|flex-end|stretch (responsive)
 *  gap        px number or {d,t,m}; or {row, column} for separate gaps
 *  grid       { cols: n|{d,t,m}, rows: n|{d,t,m}, gap: n|{d,t,m}, rowGap?, align?, justify? } → grid container
 *  pad        padding: number | [v,h] | [t,r,b,l] | {d,t,m}
 *  margin     margin, same forms
 *  bg         color string or { gradient: [colorA, colorB], angle, type: "linear"|"radial", stops: [a,b] }
 *  radius     border radius number | box | {d,t,m}
 *  border     { width, color, style: "solid", sides: [t,r,b,l] }
 *  shadow     { x, y, blur, spread, color }
 *  minHeight  px number or {d,t,m}
 *  overflow   "hidden"
 *  cls        CSS classes (string)
 *  id         CSS id (anchor)
 *  link       URL when tag is "a"
 *  reveal     stagger index (number) → Fade In Up entrance animation
 *  hide       ["mobile", ...]
 *  sticky     "top" (Pro)
 *  grow       flex grow 1 for this child (responsive allowed: {d:true,m:false})
 */
export function container(opts = {}, children = []) {
  const s = {};
  const inner = opts.inner ?? true; // overwritten by finalize based on depth
  if (opts.boxed) {
    s.content_width = "boxed";
    Object.assign(s, resp("boxed_width", opts.boxed, toPx));
  } else {
    s.content_width = "full";
  }
  if (opts.width !== undefined) Object.assign(s, resp("width", opts.width, (v) => (typeof v === "number" ? pct(v) : v)));
  if (opts.tag) s.html_tag = opts.tag;
  if (opts.link) s.link = typeof opts.link === "string" ? link(opts.link) : opts.link;

  if (opts.grid) {
    const g = opts.grid;
    s.container_type = "grid";
    Object.assign(s, resp("grid_columns_grid", g.cols, (n) => ({ unit: "fr", size: n, sizes: [] })));
    Object.assign(s, resp("grid_rows_grid", g.rows ?? 1, (n) => ({ unit: "fr", size: n, sizes: [] })));
    const gp = g.gap ?? 0;
    Object.assign(
      s,
      resp("grid_gaps", gp, (n) => ({ unit: "px", column: String(n), row: String(g.rowGap ?? n), isLinked: g.rowGap === undefined || g.rowGap === n })),
    );
    if (g.rowGap !== undefined && isResp(gp)) {
      // keep row gap override on every breakpoint
      for (const bp of Object.keys(gp)) s["grid_gaps" + BP[bp]].row = String(g.rowGap);
    }
    s.grid_auto_flow = "row";
    if (g.align) Object.assign(s, resp("grid_align_items", g.align));
    if (g.justify) Object.assign(s, resp("grid_justify_items", g.justify));
  } else {
    s.container_type = "flex";
    Object.assign(s, resp("flex_direction", opts.dir ?? "column"));
    if (opts.wrap) Object.assign(s, resp("flex_wrap", opts.wrap === true ? "wrap" : opts.wrap, (v) => (v === true ? "wrap" : v)));
    if (opts.justify) Object.assign(s, resp("flex_justify_content", opts.justify));
    if (opts.align) Object.assign(s, resp("flex_align_items", opts.align));
    const gap = opts.gap ?? 0;
    const toGap = (g) => {
      if (typeof g === "number") return { unit: "px", size: g, column: String(g), row: String(g), isLinked: true };
      const row = g.row ?? 0;
      const col = g.column ?? 0;
      return { unit: "px", size: col, column: String(col), row: String(row), isLinked: row === col };
    };
    if (isResp(gap)) Object.assign(s, resp("flex_gap", gap, toGap));
    else s.flex_gap = toGap(gap);
  }

  Object.assign(s, resp("padding", opts.pad ?? 0, toBox));
  if (opts.margin !== undefined) Object.assign(s, resp("margin", opts.margin, toBox));
  if (opts.minHeight !== undefined) Object.assign(s, resp("min_height", opts.minHeight, toPx));

  if (opts.bg) {
    if (typeof opts.bg === "string") {
      s.background_background = "classic";
      s.background_color = opts.bg;
    } else if (opts.bg.gradient) {
      const [a, b] = opts.bg.gradient;
      s.background_background = "gradient";
      s.background_color = a;
      s.background_color_b = b;
      s.background_gradient_type = opts.bg.type ?? "linear";
      s.background_gradient_angle = deg(opts.bg.angle ?? 90);
      if (opts.bg.stops) {
        s.background_color_stop = pct(opts.bg.stops[0]);
        s.background_color_b_stop = pct(opts.bg.stops[1]);
      }
    }
  }
  if (opts.border) {
    const b = opts.border;
    s.border_border = b.style ?? "solid";
    s.border_width = b.sides ? box(...b.sides) : box(b.width ?? 1);
    s.border_color = b.color ?? color.slate200;
  }
  if (opts.radius !== undefined) Object.assign(s, resp("border_radius", opts.radius, toBox));
  if (opts.shadow) Object.assign(s, shadow("box_shadow", opts.shadow));
  if (opts.overflow) s.overflow = opts.overflow;
  if (opts.cls) s.css_classes = opts.cls;
  if (opts.id) s._element_id = opts.id;
  if (opts.reveal !== undefined && opts.reveal !== false) Object.assign(s, reveal(true, opts.reveal));
  if (opts.hide) Object.assign(s, hide(opts.hide));
  if (opts.sticky) {
    s.sticky = opts.sticky;
    s.sticky_on = ["desktop", "tablet", "mobile"];
  }
  if (opts.grow !== undefined) {
    const g = isResp(opts.grow) ? opts.grow : { d: opts.grow };
    for (const [bp, on] of Object.entries(g)) {
      s["_flex_size" + BP[bp]] = on ? "grow" : "none";
    }
  }
  Object.assign(s, opts.raw ?? {});
  return { elType: "container", settings: s, elements: children.filter(Boolean), isInner: inner };
}

/* ---------------------------------------------------------------- widgets */

function widget(widgetType, settings, opts = {}) {
  const s = { ...settings };
  if (opts.cls) s._css_classes = opts.cls;
  if (opts.id) s._element_id = opts.id;
  if (opts.margin !== undefined) Object.assign(s, resp("_margin", opts.margin, toBox));
  if (opts.pad !== undefined) Object.assign(s, resp("_padding", opts.pad, toBox));
  if (opts.reveal !== undefined && opts.reveal !== false) Object.assign(s, reveal(false, opts.reveal));
  if (opts.hide) Object.assign(s, hide(opts.hide));
  if (opts.widthAuto) s._element_width = "auto";
  if (opts.maxWidth !== undefined) {
    s._element_width = "initial";
    Object.assign(s, resp("_element_custom_width", opts.maxWidth, toPx));
  }
  if (opts.grow !== undefined) {
    const g = isResp(opts.grow) ? opts.grow : { d: opts.grow };
    for (const [bp, on] of Object.entries(g)) s["_flex_size" + BP[bp]] = on ? "grow" : "none";
  }
  if (opts.alignSelf) Object.assign(s, resp("_flex_align_self", opts.alignSelf));
  if (opts.order) Object.assign(s, resp("_flex_order", opts.order));
  if (opts.absolute) {
    // Advanced › Position: absolute, offsets from the top/right ("end") corner
    s._position = "absolute";
    const a = opts.absolute;
    if (a.right !== undefined) {
      s._offset_orientation_h = "end";
      Object.assign(s, resp("_offset_x_end", a.right, toPx));
    }
    if (a.left !== undefined) Object.assign(s, resp("_offset_x", a.left, toPx));
    if (a.top !== undefined) Object.assign(s, resp("_offset_y", a.top, toPx));
    if (a.bottom !== undefined) {
      s._offset_orientation_v = "end";
      Object.assign(s, resp("_offset_y_end", a.bottom, toPx));
    }
    if (a.z !== undefined) s._z_index = a.z;
  }
  if (opts.fixed) {
    s._position = "fixed";
    const a = opts.fixed;
    if (a.left !== undefined) Object.assign(s, resp("_offset_x", a.left, toPx));
    if (a.bottom !== undefined) {
      s._offset_orientation_v = "end";
      Object.assign(s, resp("_offset_y_end", a.bottom, toPx));
    }
    if (a.z !== undefined) s._z_index = a.z;
  }
  Object.assign(s, opts.raw ?? {});
  return { elType: "widget", widgetType, settings: s, elements: [] };
}
export { widget as rawWidget };

/**
 * Heading. `text` may include inline HTML (e.g. a gradient <span>).
 * opts: tag (h1-h6, p, div, span), size, weight, lh, ls, transform, color, align, link
 */
export function heading(text, opts = {}) {
  const s = { title: text, header_size: opts.tag ?? "h2" };
  if (opts.color) s.title_color = opts.color;
  if (opts.align) Object.assign(s, resp("align", opts.align));
  if (opts.link) s.link = typeof opts.link === "string" ? link(opts.link) : opts.link;
  Object.assign(
    s,
    typo("typography", {
      size: opts.size,
      weight: opts.weight ?? 800,
      lh: opts.lh,
      ls: opts.ls,
      transform: opts.transform,
    }),
  );
  return widget("heading", s, opts);
}

/** Text Editor (rich text). `html` is the editor content. */
export function text(html, opts = {}) {
  const s = { editor: html };
  if (opts.color) s.text_color = opts.color;
  if (opts.align) Object.assign(s, resp("align", opts.align));
  Object.assign(s, typo("typography", { size: opts.size ?? "base", weight: opts.weight ?? 400, lh: opts.lh }));
  if (opts.linkColor) s.link_color = opts.linkColor;
  if (opts.paragraphGap !== undefined) s.paragraph_spacing = px(opts.paragraphGap);
  return widget("text-editor", s, opts);
}

/** Button style presets mirroring .btn-primary / .btn-secondary / .btn-on-dark. */
const BUTTON = {
  primary: {
    background_background: "gradient",
    background_color: color.accent600,
    background_color_b: color.accent700,
    background_gradient_type: "linear",
    background_gradient_angle: deg(90),
    button_text_color: color.white,
    ...shadow("button_box_shadow", { x: 0, y: 8, blur: 24, spread: -8, color: "rgba(200,22,26,0.6)" }),
  },
  secondary: {
    background_background: "classic",
    background_color: color.white,
    button_text_color: color.brand800,
    border_border: "solid",
    border_width: box(1),
    border_color: color.brand200,
    ...shadow("button_box_shadow", { x: 0, y: 1, blur: 2, spread: 0, color: "rgba(0,0,0,0.05)" }),
  },
  onDark: {
    background_background: "classic",
    background_color: "rgba(255,255,255,0.1)",
    button_text_color: color.white,
    border_border: "solid",
    border_width: box(1),
    border_color: "rgba(255,255,255,0.25)",
  },
  link: {
    background_background: "classic",
    background_color: "rgba(0,0,0,0)",
    button_text_color: color.brand700,
  },
};

/**
 * Button.
 * opts: variant (primary|secondary|onDark|link), icon (fa name), iconPos ("left"|"right"),
 *       size ("base"|"lg"|"sm"|number px), full (stretch), align (responsive: left|center|right|justify),
 *       padY, padX, minHeight, external
 */
export function button(label, url, opts = {}) {
  const variant = opts.variant ?? "primary";
  const fontSize = opts.size === "lg" ? 18 : opts.size === "sm" ? 14 : typeof opts.size === "number" ? opts.size : 16;
  const s = {
    text: label,
    link: link(url, { external: opts.external }),
    size: "md",
    ...BUTTON[variant],
    ...typo("typography", { size: fontSize, weight: 700, lh: 1.5 }),
    border_radius: box(9999),
  };
  if (variant === "link") s.text_padding = box(0);
  else s.text_padding = box(opts.padY ?? 12, opts.padX ?? 24);
  if (opts.icon) {
    s.selected_icon = typeof opts.icon === "string" ? fa(opts.icon) : opts.icon;
    s.icon_align = opts.iconPos ?? "right";
    s.icon_indent = px(opts.iconGap ?? 8);
  }
  if (opts.align) Object.assign(s, resp("align", opts.align));
  if (opts.full) Object.assign(s, resp("align", opts.full === true ? "justify" : opts.full));
  const cls = [`jmt-btn`, `jmt-btn--${variant}`, opts.cls].filter(Boolean).join(" ");
  return widget("button", s, { ...opts, cls });
}

/**
 * Icon. opts: view ("default"|"stacked"|"framed"), shape ("circle"|"square"), primary (bg for stacked / colour),
 * secondary (icon colour when stacked), size px, pad px (stacked padding), radius px, link, align
 */
export function icon(name, opts = {}) {
  const s = { selected_icon: typeof name === "string" ? fa(name) : name, view: opts.view ?? "default" };
  if (opts.view && opts.view !== "default") s.shape = opts.shape ?? "circle";
  if (opts.primary) s.primary_color = opts.primary;
  if (opts.secondary) s.secondary_color = opts.secondary;
  if (opts.size !== undefined) Object.assign(s, resp("size", opts.size, toPx));
  if (opts.pad !== undefined) Object.assign(s, resp("icon_padding", opts.pad, toPx));
  if (opts.radius !== undefined) s.border_radius = toBox(opts.radius);
  if (opts.link) s.link = typeof opts.link === "string" ? link(opts.link) : opts.link;
  if (opts.align) Object.assign(s, resp("align", opts.align));
  return widget("icon", s, opts);
}

/**
 * Icon Box. opts: icon, title, desc, position ("top"|"left"|"right", responsive), titleTag,
 *   view/shape/primary/secondary/iconSize/iconPad/iconRadius, iconGap,
 *   titleColor, titleSize, titleWeight, descColor, descSize, titleGap, align (text_align), link
 */
export function iconBox(opts) {
  const s = {
    selected_icon: typeof opts.icon === "string" ? fa(opts.icon) : opts.icon,
    title_text: opts.title,
    description_text: opts.desc ?? "",
    title_size: opts.titleTag ?? "h3",
    view: opts.view ?? "default",
  };
  if (s.view !== "default") s.shape = opts.shape ?? "circle";
  Object.assign(s, resp("position", opts.position ?? "top"));
  if (opts.align) Object.assign(s, resp("text_align", opts.align));
  if (opts.verticalAlign) s.content_vertical_alignment = opts.verticalAlign;
  if (opts.primary) s.primary_color = opts.primary;
  if (opts.secondary) s.secondary_color = opts.secondary;
  if (opts.iconSize !== undefined) Object.assign(s, resp("icon_size", opts.iconSize, toPx));
  if (opts.iconPad !== undefined) Object.assign(s, resp("icon_padding", opts.iconPad, toPx));
  if (opts.iconRadius !== undefined) s.border_radius = toBox(opts.iconRadius);
  if (opts.iconGap !== undefined) Object.assign(s, resp("icon_space", opts.iconGap, toPx));
  if (opts.titleGap !== undefined) Object.assign(s, resp("title_bottom_space", opts.titleGap, toPx));
  if (opts.titleColor) s.title_color = opts.titleColor;
  if (opts.descColor) s.description_color = opts.descColor;
  Object.assign(s, typo("title_typography", { size: opts.titleSize ?? "xl", weight: opts.titleWeight ?? 800, lh: opts.titleLh, ls: opts.titleLs }));
  Object.assign(s, typo("description_typography", { size: opts.descSize ?? "base", weight: 400 }));
  if (opts.link) s.link = typeof opts.link === "string" ? link(opts.link) : opts.link;
  return widget("icon-box", s, opts);
}

/**
 * Icon List. items: [{ text, icon?, url? }]
 * opts: inline (chips/row), iconColor, iconSize, textColor, textHover, size, weight, gap (space_between),
 *   iconGap (text_indent), align, divider
 */
export function iconList(items, opts = {}) {
  const s = {
    view: opts.inline ? "inline" : "traditional",
    icon_list: items.map((it) => {
      const row = { text: it.text, selected_icon: it.icon ? (typeof it.icon === "string" ? fa(it.icon) : it.icon) : { value: "", library: "" } };
      if (it.url) row.link = link(it.url);
      return row;
    }),
  };
  if (opts.gap !== undefined) Object.assign(s, resp("space_between", opts.gap, toPx));
  if (opts.align) Object.assign(s, resp("icon_align", opts.align));
  if (opts.iconColor) s.icon_color = opts.iconColor;
  if (opts.iconSize !== undefined) Object.assign(s, resp("icon_size", opts.iconSize, toPx));
  if (opts.iconGap !== undefined) s.text_indent = px(opts.iconGap);
  if (opts.textColor) s.text_color = opts.textColor;
  if (opts.textHover) s.text_color_hover = opts.textHover;
  if (opts.iconSelfAlign) s.icon_self_vertical_align = opts.iconSelfAlign;
  Object.assign(s, typo("icon_typography", { size: opts.size ?? "base", weight: opts.weight ?? 400, lh: opts.lh }));
  return widget("icon-list", s, opts);
}

/** Image. img: { url, id?, alt }. opts: width (px or {d,t,m}), link, align, size ("full") */
export function image(img, opts = {}) {
  const s = {
    image: { url: img.url, id: img.id ?? "", size: "", alt: img.alt ?? "", source: "library" },
    image_size: opts.size ?? "full",
  };
  if (opts.width !== undefined) Object.assign(s, resp("width", opts.width, toPx));
  if (opts.align) Object.assign(s, resp("align", opts.align));
  if (opts.link) {
    s.link_to = "custom";
    s.link = typeof opts.link === "string" ? link(opts.link) : opts.link;
  }
  return widget("image", s, opts);
}

/** Custom HTML (decorative graphics, JSON-LD). */
export function html(code, opts = {}) {
  return widget("html", { html: code }, opts);
}

/** Spacer. */
export function spacer(height, opts = {}) {
  return widget("spacer", resp("space", height, toPx), opts);
}

/**
 * Nested Accordion (Elementor 3.15+ default accordion). items: [{ title, content: [elements] }].
 * Each item's content is a container holding the given widgets.
 * opts: faqSchema (bool), titleColor, activeTitleColor, iconColor, activeIconColor, gap
 */
export function nestedAccordion(items, opts = {}) {
  const s = {
    items: items.map((it) => ({ item_title: it.title })),
    accordion_item_title_position_horizontal: "stretch",
    accordion_item_title_icon_position: "end",
    accordion_item_title_icon: fa("plus"),
    accordion_item_title_icon_active: fa("times"),
    default_state: "all_collapsed",
    max_items_expended: "multiple",
    title_tag: opts.titleTag ?? "div",
    ...(opts.faqSchema ? { faq_schema: "yes" } : {}),
    ...(opts.raw ?? {}),
  };
  return {
    elType: "widget",
    widgetType: "nested-accordion",
    settings: Object.assign(s, opts.cls ? { _css_classes: opts.cls } : {}),
    elements: items.map((it) =>
      container({ pad: it.pad ?? 0, gap: 0, raw: { _title: it.title } }, Array.isArray(it.content) ? it.content : [it.content]),
    ),
  };
}

/* --------------------------------------------------------------- document */

/** Assign deterministic 7-char hex ids and isInner flags. Returns the content array. */
export function finalize(content, seed) {
  let n = 0;
  const seen = new Set();
  const nextId = () => {
    for (;;) {
      const id = crypto.createHash("sha1").update(`${seed}:${n++}`).digest("hex").slice(0, 7);
      if (!seen.has(id)) {
        seen.add(id);
        return id;
      }
    }
  };
  const walk = (el, depth) => {
    const out = { id: nextId(), elType: el.elType };
    if (el.elType === "widget") out.widgetType = el.widgetType;
    out.settings = el.settings;
    out.elements = (el.elements ?? []).map((c) => walk(c, depth + 1));
    out.isInner = el.elType === "container" ? depth > 0 : false;
    // repeater rows need their own _id
    for (const v of Object.values(out.settings)) {
      if (Array.isArray(v) && v.length && typeof v[0] === "object" && v[0] !== null && !("unit" in v[0])) {
        for (const row of v) if (!row._id) row._id = nextId();
      }
    }
    return out;
  };
  return content.map((el) => walk(el, 0));
}
