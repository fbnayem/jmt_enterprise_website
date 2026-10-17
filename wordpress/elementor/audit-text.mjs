#!/usr/bin/env node
/**
 * Copy-fidelity audit: compares the visible text of the running Next.js site
 * with every string in the Elementor export, page by page.
 *
 *   npx next dev -p 3100 &
 *   node wordpress/elementor/audit-text.mjs [distDir] [--base http://localhost:3100]
 *
 * Reports lines on the live page that the Elementor page lacks ("missing") and
 * Elementor strings that never appear on the live page ("extra").
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const baseArg = args.indexOf("--base");
const base = baseArg > -1 ? args.splice(baseArg, 2)[1] : "http://localhost:3100";
const dist = path.resolve(args[0] ?? path.join(here, "dist"));

const norm = (s) =>
  s
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;|’/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[‐-–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const stripHtml = (h) =>
  h
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<(br|\/p|\/li|\/h\d|\/div|\/ol|\/ul|\/span|\/legend|\/label|\/option)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");

/** All human-visible strings in an Elementor element tree. */
function elementorStrings(content) {
  const out = [];
  const add = (s) => {
    if (typeof s !== "string") return;
    for (const line of stripHtml(s).split("\n")) if (norm(line)) out.push(line);
  };
  const walk = (el) => {
    const s = el.settings ?? {};
    switch (el.widgetType) {
      case "heading":
        add(s.title);
        break;
      case "text-editor":
        add(s.editor);
        break;
      case "button":
        add(s.text);
        break;
      case "icon-box":
        add(s.title_text);
        add(s.description_text);
        break;
      case "icon-list":
        for (const i of s.icon_list ?? []) add(i.text);
        break;
      case "html":
        add(s.html);
        break;
      case "nested-accordion":
        for (const i of s.items ?? []) add(i.item_title);
        break;
      case "form":
        for (const f of s.form_fields ?? []) {
          add(f.field_label);
          add(f.placeholder);
          add(f.acceptance_text);
          add(f.field_html);
          for (const o of (f.field_options ?? "").split("\n")) add(o.split("|")[0]);
        }
        add(s.button_text);
        add(s.step_next_label);
        add(s.step_previous_label);
        break;
      case "image":
        break;
      default:
        break;
    }
    for (const c of el.elements ?? []) walk(c);
  };
  content.forEach(walk);
  return out;
}

const load = (f) => JSON.parse(fs.readFileSync(path.join(dist, "templates", f), "utf8"));
const global = [...elementorStrings(load("header.json").content), ...elementorStrings(load("footer.json").content)];

const pages = {
  "/": "page-home.json",
  "/services": "page-services.json",
  "/service-areas": "page-service-areas.json",
  "/about": "page-about.json",
  "/faqs": "page-faqs.json",
  "/contact": "page-contact.json",
  "/request-a-quote": "page-request-a-quote.json",
  "/request-received": "page-request-received.json",
  "/privacy-policy": "page-privacy-policy.json",
  "/service-terms": "page-service-terms.json",
  "/this-page-does-not-exist": "error-404.json",
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || (fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
let problems = 0;
const report = [];
for (const [url, file] of Object.entries(pages)) {
  if (!fs.existsSync(path.join(dist, "templates", file))) {
    report.push(`\n## ${url}: ${file} not built`);
    problems++;
    continue;
  }
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  const live = await page.evaluate(() => {
    const pick = (sel) => [...document.querySelectorAll(sel)].map((e) => e.innerText);
    // main content plus header and footer text; decorative aria-hidden blocks included via textContent
    const decorative = [...document.querySelectorAll("main [aria-hidden=true]")].map((e) => e.textContent);
    return { main: pick("main"), chrome: [...pick("header"), ...pick("footer")], decorative };
  });
  const ours = elementorStrings(load(file).content);
  const corpus = norm([...ours, ...global].join(" \n "));
  const liveLines = [...live.main, ...live.decorative]
    .join("\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => norm(l) && !/^\d+$/.test(l.trim()));
  const missing = [...new Set(liveLines)].filter((l) => !corpus.includes(norm(l)));
  const liveCorpus = norm([...live.main, ...live.decorative, ...live.chrome].join(" \n "));
  const extra = [...new Set(ours)].filter((s) => !liveCorpus.includes(norm(s)));
  report.push(`\n## ${url} (${file})`);
  report.push(`missing from Elementor (${missing.length}):`);
  for (const m of missing) report.push(`  - ${m}`);
  report.push(`only in Elementor (${extra.length}):`);
  for (const e of extra) report.push(`  + ${e}`);
  problems += missing.length + extra.length;
}
// header/footer chrome once
await page.goto(base + "/", { waitUntil: "networkidle" });
const chrome = await page.evaluate(() => [...document.querySelectorAll("header, footer")].map((e) => e.innerText).join("\n"));
const g = norm(global.join(" \n "));
const navLabels = ["Services", "Service Areas", "About", "FAQs", "Contact"]; // live in the WordPress menu, not in JSON
const chromeMissing = [...new Set(chrome.split("\n").map((l) => l.trim()).filter(Boolean))].filter(
  (l) => !g.includes(norm(l.replace(/^© \d{4}/, "© 2026"))) && !navLabels.includes(l),
);
report.push(`\n## header + footer`);
report.push(`missing (${chromeMissing.length}):`);
for (const m of chromeMissing) report.push(`  - ${m}`);
problems += chromeMissing.length;
await browser.close();
console.log(report.join("\n"));
console.log(`\n${problems} differences`);
