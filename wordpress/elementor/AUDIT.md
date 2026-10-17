# Audit report – Elementor export

Audited on 2026-10-17 against the live demo build (branch `logo-and-brand-colours`, running locally).

## Result

| Check | How | Result |
|---|---|---|
| Structure and settings | `validate.mjs`: every container and widget setting key checked against an allowlist built from a real Elementor 4.3.5 + Pro 4.3.2 site, value shapes (units, colours, links, icons), Font Awesome 5 icon names, one H1 per page, internal links, form fields, accordion structure, kit manifest, conditions, page template | 0 errors, 0 warnings |
| Copy | `audit-text.mjs`: visible text of every live page, header and footer compared with every string in the Elementor files | Every static page matches word for word. Remaining differences are listed below and are all expected |
| Import format | Expert review of the kit manifest, file layout, Theme Builder conditions, form widget, dynamic tags, site settings | 14 findings, all fixed or documented (see below) |
| Design fidelity | Section-by-section review of every page against the Tailwind source, with measurements of the live site at 1440, 900 and 390 px | 26 findings, 25 fixed, 1 accepted (mobile menu, see below) |

## Fixed after review

Import and behaviour:
- Quote form redirect is now a full URL (Elementor ignores relative redirects, so visitors never reached the thank-you page).
- Phone field is a text field (Elementor's Tel field rejects numbers typed with spaces).
- 404 template location is `single`; manifest site-settings keys match Elementor's exporter; unused `wp-content` key removed.
- Form field focus border now has a border type so the focus colour applies.
- Button icon position uses the current `row` / `row-reverse` values; icon-list alignment uses `flex-start`.
- Site logo removed from site settings (it cannot be sideloaded there); the header and footer images carry it.
- Pages use Hello's default template with the title hidden, so the page has a `<main>` landmark for "Skip to content".

Design:
- Prose headings spacing and line height (Privacy, Terms, About); FAQ list top margin.
- Icon list gaps and round icon badges (header phone, footer contact, check badges); icon sizes.
- Steps connector length on mobile; card title top margin; button line heights; footer column widths.
- Icon chip padding on mobile written as per-element CSS (Elementor's icon padding is not responsive).
- Nav underline grows from the left like the live site; mobile dropdown padding and insets.
- Quote form: numbered stepper with labels, "Step N of 4" and an H2 per step, field padding and shadow, group dividers, inline SVG phone icon.
- Glow backdrop positions, balanced headings only where the live site uses them, anchor offset on Services, "Learn more" arrow on card hover, chip shadows and borders.
- Own `jmt-fade-up` keyframes so Elementor's fadeInUp cannot override the reveal distance.
- SVG versions of every icon colour rule (for Elementor's inline icon mode).
- Accessibility: decorative numbers hidden from screen readers, footer nav and quick-action bar labelled, Call button labelled.

## Remaining differences (expected)

- Quote form: no repeating item/stop blocks, no conditional fields, no review screen, no saved draft (limits of Elementor's Form widget; see README).
- Thank-you page cannot show the JMT reference number, so its wording says the request was emailed instead.
- "Preview only" notices were a staging feature and are left out.
- Mobile menu is Elementor's dropdown, without the dimmed backdrop and in-menu quote button (the quote button stays in the mobile quick-action bar).
- Icons are Font Awesome 5 equivalents of the Lucide icons; the solid style looks slightly heavier.
- The marquee, route illustration and collapsed FAQ answers show as differences in the copy audit only because the live text is read differently; the words are the same.

## Not verified here

No WordPress could be installed in the build environment, so nothing was imported into a real site. Points to check on the first import:
- The kit imports with pages, templates, conditions and site settings (format follows Elementor's exporter but was not round-tripped).
- The quote form steps, upload limits and both emails work, and the stepper looks like the live one (styled against Elementor Pro's documented markup).
- The nav menu must be created by hand (README step 3).
- Per-field CSS classes in the form are kept but hidden in the editor.
