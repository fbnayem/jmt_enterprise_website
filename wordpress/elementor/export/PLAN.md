# JMT Enterprise website → WordPress + Elementor Pro: build plan

Source of truth: branch `logo-and-brand-colours` (the design on https://jmt-enterprise-staging.vercel.app).
All copy comes straight from `src/content/site.ts` and the page files, so the WordPress text matches the live demo word for word.

## Target and deliverables

- **Target:** WordPress 6.8+ with **Elementor 3.25+ / 4.x and Elementor Pro** (checked against an Elementor 4.3.5 + Pro 4.3.2 install). Pro is needed for the Theme Builder header/footer/404, the Nav Menu, the multi-step Form and sticky header. Every Pro-only part is listed under "Free Elementor fallbacks".
- **Layout model:** Flexbox Containers (no legacy sections/columns), classic widgets, Elementor's own breakpoints (mobile ≤767, tablet ≤1024), which match the site's `sm`/`lg` switch points.
- **Deliverables** (in `/mnt/project-files/jmt-wordpress` and committed under `wordpress/elementor/` in the repo):
  1. `jmt-enterprise-elementor-kit.zip`: Website Kit for Elementor › Tools › Import/Export (pages, header, footer, 404, global colours and fonts, front page).
  2. `templates/*.json`: one template per page plus header, footer, 404 and the CTA band, for Templates › Saved Templates › Import (works even if the kit import is not used).
  3. `README.md`: import steps, menu setup, form email settings, SEO titles and descriptions per page, and what to check after import.
  4. `AUDIT.md`: the audit results.
- **Images:** the logo is referenced from the public GitHub copy pinned to this commit, so Elementor downloads it into the Media Library on import.

## Site-wide settings (Kit)

| Site setting | Value |
|---|---|
| Global colours | Primary navy #0c2650, Secondary #1f4892, Text #4a5571, Accent red #c8161a, plus Logo red #b00a0c, Navy 950 #071733, Ink #0b1226, Brand 50/100/200/300/700/800, Accent 400/500, Slate 50/200, White |
| Global fonts | Plus Jakarta Sans (Google font): headings 800, body 400, buttons 700 |
| Layout | Content width 1280px, page gutters 16/24/32px, white body, ink text |
| Buttons | Pill radius, red gradient primary, white secondary, glass on-dark variant |
| Form fields | 48px tall, 12px radius, slate border, navy focus ring |
| Custom CSS | Glow + grid backdrop, card hover lift, eyebrow pills, gradient text, marquee, route animation, step connector line, sticky-header blur, reduced-motion support |

## Widget map, part by part

| Part of the site | Elementor widget(s) |
|---|---|
| **Header** (Theme Builder › Header, whole site) | Sticky Container (Pro sticky) · Image (logo, links home) · **Nav Menu** (Pro, menu "JMT Main Menu", underline pointer, hamburger dropdown on tablet/mobile) · Icon List (phone with icon, desktop) · Button "Request a Quote" + arrow · Icon (phone circle, mobile) |
| **Footer** (Theme Builder › Footer) | Container grid · Image (logo on white card) · Text Editor · Button · Heading "Pages" + Icon List links (2 columns) · Heading "Contact" + Icon List (phone, email) · Heading with Current Date dynamic tag (© year) · HTML (LocalBusiness JSON-LD, same as the live site) |
| **Mobile quick-action bar** | Fixed Container in the footer (mobile/tablet only) with two Buttons (Call, Request a Quote); hidden on the quote and thank-you pages by page CSS, like the live site |
| Page hero (all inner pages) | Container (navy + glow) · Heading (eyebrow pill) · Heading H1 · Text Editor |
| Home hero | Container 2-col · Heading (pulsing eyebrow) · Heading H1 with gradient words · Text Editor · 2 Buttons (quote, call) · Icon List (shield reassurance line) · **HTML** (animated pickup-to-drop-off route illustration, decorative) |
| Item marquee | HTML (CSS marquee, decorative, `aria-hidden`), no Elementor widget scrolls text this way |
| Section headings | Heading (eyebrow) · Heading H2 · Text Editor |
| Service cards (home, 7) | Container grid (3 cols desktop, 2 mobile, first card spans 2) · **Icon Box** (icon chip, title, description) · Icon List inline (example chips) · Button link-style "Learn more" → /services#anchor |
| Who we help (2 cards) | Container · Icon · Heading H3 · Icon List (check icons, 2 columns) |
| How it works (4 steps) | Container grid with connector line · Heading (numbered circle) · Heading H3 · Text Editor |
| Vehicle options (4) | Container grid · Heading (01-04) · Icon Box · Container strip with Text Editor + Button |
| Service area chips | Heading H3 per region · Icon List inline (city chips) · Text Editor (phone link) |
| Why choose JMT (4) | Icon Box (check icon, left position) in card containers |
| FAQ (home 4, FAQs page 9) | **Nested Accordion** (plus/close icons) with Text Editor answers; FAQ schema switched on for the FAQs page only, as on the live site · Button "See all FAQs" |
| CTA band | Container (rounded navy + glow) · Heading H2 · Text Editor · 2 Buttons; also saved as its own template |
| Services page (7 detailed services) | Card Container with anchor ID per service · Heading (big 01-07, absolute) · Icon · Heading H2 · Text Editor · 2 inner cards of Heading H3 + Icon List (checks) · Button "Request a quote" → /request-a-quote?service=key |
| About | Heading H2 + Text Editor pairs · sticky card with Image (logo) + Text Editor |
| Service Areas | Text Editor · Heading H2 + Icon List (city tiles, 3-col grid) per region · card with Heading + Text Editor (phone and email links) |
| Contact | Linked card Containers with Icon + Headings (Call, Email) · Scheduling card ("Call to schedule", no hours) · navy card with Heading, Text Editor, Button |
| **Request a Quote** | Hero (Heading with gradient word, Text Editor, Icon List call link) · **Form** (Pro) in an overlapping white card: 4 **Step** fields with progress bar (Pickup and delivery, Items and access, Photos, Contact and review), Select/Radio/Text/Number/Date/Textarea/Checkbox fields, **Upload** (up to 5 JPEG/PNG/WebP, 10 MB each), Acceptance (the exact acknowledgement wording), Honeypot, HTML notes; actions: Collect Submissions, Email to support@jmtenterprise.net, confirmation Email to the customer, Redirect to /request-received |
| Request received | Icon (green check, pulse) · Heading H1 · Text Editor · card with Heading + numbered list · Button "Back to home" |
| Privacy Policy, Service Terms | Page hero · Heading H2 + Text Editor pairs |
| 404 | Theme Builder › Single 404: Heading, Text Editor, 2 Buttons |
| Scroll reveal / hover motion | Elementor Entrance Animation (Fade In Up, staggered delays) · kit CSS for card lift and button hover |
| Icons | Font Awesome equivalents of the site's Lucide icons (e.g. Armchair → couch, Weight → weight-hanging, Truck → truck-pickup) |

## Where WordPress cannot match the Next.js build exactly (decided defaults)

1. **Quote form logic.** Elementor's form has no repeaters, conditional fields or review screen. Defaults: one detailed item block plus an "Other items" box; up to 3 extra stops in one text box; Company name always shown but optional; "Same access as pickup" is a checkbox; the review summary is replaced by the customer confirmation email listing all answers. The draft-saving, reference number and Turnstile check are Next.js features; Elementor adds Submissions, honeypot and optional reCAPTCHA instead.
2. **Reference number.** Elementor cannot generate the JMT-YYMMDD-XXXXX reference, so the thank-you page uses the "receipt in your email" wording the live site already shows when no reference is present.
3. **"Preview only" notices** are a staging feature and are left out of the WordPress build.
4. **SEO titles, meta descriptions, noindex on draft policies** live in the SEO plugin (Rank Math or Yoast), not in Elementor. The README lists each page's exact title and description to paste in.

## Free Elementor fallbacks

Header/Footer/404 need Theme Builder (Pro): on free Elementor, insert the header and footer templates at the top/bottom of each page or use a theme's header. Nav Menu → Icon List links. Form → a form plugin (WPForms/Fluent Forms). Sticky header → kit CSS `position:sticky`.

## How the work is split (multi-agent)

1. **Core (me):** generator library (`wordpress/elementor/src`): element builders with the exact Elementor setting keys, kit settings, kit CSS, header, footer, page hero, CTA band, kit packaging.
2. **Parallel builders:** agent A builds the Home page; agent B builds Services, About, Service Areas, Contact, FAQs; agent C builds Request a Quote (form), Request received, Privacy, Terms, 404.
3. **Parallel auditors:** content fidelity (every heading, sentence, link and button compared with the rendered Next.js pages), Elementor schema (every setting key and value checked against real Elementor 4.3 data), and design/responsive/accessibility review against the Tailwind classes.
4. Fix every finding, rebuild, re-audit until clean, then commit and deliver.
