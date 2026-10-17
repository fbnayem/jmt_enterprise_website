#!/usr/bin/env node
/**
 * Builds the Elementor export for the JMT Enterprise site.
 *
 *   node wordpress/elementor/build.mjs [--out <dir>]
 *
 * Writes to wordpress/elementor/dist (or --out):
 *   templates/*.json                  one Elementor library template per page + header/footer/404/CTA
 *   jmt-site.css                      site CSS (already inside the kit's Custom CSS)
 *   jmt-enterprise-elementor-kit.zip  Website Kit for Elementor › Tools › Import/Export
 *   seo.json                          titles/descriptions for the SEO plugin
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { finalize } from "./src/el.mjs";
import { kitSettings, siteCss } from "./src/kit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outArg = process.argv.indexOf("--out");
const out = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : path.join(here, "dist");

const ELEMENTOR_VERSION = "3.25.0";
const PRO_VERSION = "3.25.0";

/** Page order = menu/kit order. Each module default-exports a page definition. */
const PAGE_FILES = [
  "home",
  "services",
  "service-areas",
  "about",
  "faqs",
  "contact",
  "request-a-quote",
  "request-received",
  "privacy-policy",
  "service-terms",
];
const TEMPLATE_FILES = ["header", "footer", "error-404", "cta-band"];

const missing = [];
const load = async (rel) => {
  const file = path.join(here, "src", rel);
  if (!fs.existsSync(file)) return void missing.push(rel);
  return (await import(file)).default;
};
const pages = [];
for (const f of PAGE_FILES) pages.push(await load(`pages/${f}.mjs`));
const templates = [];
for (const f of TEMPLATE_FILES) templates.push(await load(`templates/${f}.mjs`));
if (missing.length) {
  if (!process.argv.includes("--partial")) throw new Error(`Missing modules: ${missing.join(", ")}`);
  console.warn(`Skipping missing modules: ${missing.join(", ")}`);
}
pages.splice(0, pages.length, ...pages.filter(Boolean));
templates.splice(0, templates.length, ...templates.filter(Boolean));

// Default (theme) template so Hello wraps the content in <main id="content">; title hidden (each page has its own H1)
const PAGE_DEFAULTS = { template: "default", hide_title: "yes" };

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "templates"), { recursive: true });

const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data, null, 2) + "\n");
};

/* ---------------- library templates (Templates › Saved Templates › Import) ---------------- */
const built = { pages: [], templates: [] };
for (const p of pages) {
  const content = finalize(p.content(), `page:${p.slug}`);
  const settings = { ...PAGE_DEFAULTS, ...(p.pageSettings ?? {}) };
  built.pages.push({ def: p, content, settings });
  write(path.join(out, "templates", `page-${p.slug}.json`), {
    content,
    page_settings: settings,
    version: "0.4",
    title: `JMT – ${p.title}`,
    type: "page",
  });
}
for (const t of templates) {
  const content = finalize(t.content(), `template:${t.name}`);
  const settings = t.pageSettings ?? {};
  built.templates.push({ def: t, content, settings });
  write(path.join(out, "templates", `${t.name}.json`), {
    content,
    page_settings: settings,
    version: "0.4",
    title: t.title,
    type: t.type,
  });
}

/* ---------------- Website Kit (Elementor › Tools › Import/Export) ---------------- */
const kitDir = path.join(out, "kit");
const manifest = {
  name: "jmt-enterprise",
  title: "JMT Enterprise LLC",
  description: "JMT Enterprise pickup and delivery website: pages, header, footer, 404 and site settings.",
  author: "AbedinTech",
  version: "2.0",
  elementor_version: ELEMENTOR_VERSION,
  created: new Date().toISOString().slice(0, 19).replace("T", " "),
  thumbnail: false,
  site: "https://jmtenterprise.net",
  "site-settings": {
    theme: false,
    globalColors: true,
    globalFonts: true,
    themeStyleTypography: true,
    themeStyleButtons: true,
    themeStyleImages: true,
    themeStyleFormFields: true,
    generalSettings: true,
    experiments: false,
  },
  templates: {},
  content: { page: {} },
  "custom-post-type-title": {},
  plugins: [
    { name: "Elementor", plugin: "elementor/elementor", pluginUri: "https://elementor.com/", version: ELEMENTOR_VERSION },
    { name: "Elementor Pro", plugin: "elementor-pro/elementor-pro", pluginUri: "https://elementor.com/pro/", version: PRO_VERSION },
  ],
};

let pageId = 101;
for (const { def, content, settings } of built.pages) {
  const id = pageId++;
  manifest.content.page[id] = {
    title: def.title,
    excerpt: "",
    doc_type: "wp-page",
    thumbnail: false,
    url: `https://jmtenterprise.net/${def.front ? "" : `${def.slug}/`}`,
    terms: [],
    ...(def.front ? { show_on_front: true } : {}),
  };
  write(path.join(kitDir, "content", "page", `${id}.json`), { content, settings, metadata: [] });
}
let tplId = 201;
for (const { def, content, settings } of built.templates) {
  const id = tplId++;
  manifest.templates[id] = {
    title: def.title,
    doc_type: def.type,
    thumbnail: false,
    ...(def.conditions ? { conditions: def.conditions, location: def.type === "error-404" ? "single" : def.type } : {}),
  };
  write(path.join(kitDir, "templates", `${id}.json`), { content, settings, metadata: [] });
}
write(path.join(kitDir, "site-settings.json"), { content: [], settings: kitSettings(), metadata: [] });
write(path.join(kitDir, "manifest.json"), manifest);

const zip = path.join(out, "jmt-enterprise-elementor-kit.zip");
execFileSync("zip", ["-qrX", zip, "."], { cwd: kitDir });

/* ---------------- extras ---------------- */
write(path.join(out, "jmt-site.css"), siteCss());
write(
  path.join(out, "seo.json"),
  pages.map((p) => ({ page: p.title, url: p.front ? "/" : `/${p.slug}`, ...p.seo })),
);

console.log(
  `Built ${built.pages.length} pages and ${built.templates.length} templates → ${path.relative(process.cwd(), out)}`,
);
