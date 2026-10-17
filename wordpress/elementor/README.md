# JMT Enterprise – WordPress + Elementor export

This folder turns the Next.js site into an Elementor Pro build that looks and reads the same.
All copy comes from `src/content/site.ts` and the page files, so the WordPress pages match the live demo word for word.

## What you get

| File | Use it for |
|---|---|
| `jmt-enterprise-elementor-kit.zip` | **Main route.** Elementor › Tools › Import/Export › Import a Template Kit. Creates all 10 pages, the header, footer and 404 (with display conditions), the CTA block, global colours, global fonts, theme styles, layout settings and the site CSS, and sets Home as the front page. |
| `templates/*.json` | **Backup route.** Templates › Saved Templates › Import Templates, one file at a time. Use these if the kit import is not available or you only want some pages. |
| `jmt-site.css` | The site CSS. Already inside the kit; paste it into Site Settings › Custom CSS only if you used the backup route. |
| `seo.json` | Page titles, meta descriptions and noindex flags for Rank Math or Yoast. |

## Requirements

- WordPress 6.5 or newer, **Hello Elementor** theme (recommended; any theme that lets Elementor Theme Builder replace the header and footer works).
- **Elementor 3.25+ (works with 4.x) and Elementor Pro.** Pro is needed for the header/footer/404 (Theme Builder), the Nav Menu, the quote Form, sticky header, the current-year tag and Custom CSS.
- In Elementor › Settings › Features, **Flexbox Container** and **Nested Elements** must be active (they are on by default in current versions).

## Import, step by step (kit route)

1. Install and activate Hello Elementor, Elementor and Elementor Pro (licence activated).
2. Elementor › Tools › **Import/Export Kit** › Import. Upload `jmt-enterprise-elementor-kit.zip` and import everything (Content, Templates, Site Settings). Approve the media download so the logo is copied into your Media Library.
3. **Create the main menu.** Appearance › Menus › create a menu named **JMT Main Menu** (it must get the slug `jmt-main-menu`) with these pages in this order: Services, Service Areas, About, FAQs, Contact. Do not assign it to a theme location. The header's Nav Menu widget already points to it. If the menu was created with another name, edit the header and pick it in the Nav Menu widget.
4. Settings › Permalinks › **Post name**. Then check the URLs are `/services`, `/service-areas`, `/about`, `/faqs`, `/contact`, `/request-a-quote`, `/request-received`, `/privacy-policy`, `/service-terms`. WordPress makes the URL from the page title; if a page already existed (WordPress ships a draft "Privacy Policy"), delete the old one and rename the slug to drop any `-2`.
5. Settings › Reading: Home should already be the static front page; confirm it.
6. Open **Templates › Theme Builder** and confirm JMT Header and JMT Footer show "Entire Site" and JMT 404 shows "404 Page".
7. **Quote form email.** Edit Request a Quote › the Form › Actions After Submit:
   - Email: To `support@jmtenterprise.net`. Set **From Email** to an address on your own domain (e.g. `quotes@jmtenterprise.net`), otherwise mail is often rejected.
   - Email 2 (customer confirmation): same From address.
   - Install an SMTP plugin (WP Mail SMTP, FluentSMTP or Elementor's Site Mailer) so WordPress mail is delivered reliably.
   - Submissions are kept under Elementor › Submissions even if an email fails.
   - Optional: Elementor › Settings › Integrations › reCAPTCHA v3 keys, then add a reCAPTCHA v3 field to the form.
8. **SEO.** In Rank Math or Yoast, paste each page's title and description from the table below. Set Privacy Policy, Service Terms and Request Received to **noindex** (the first two stay noindex until JMT approves the wording, as on the live site).
9. Clear Elementor's cache (Elementor › Tools › Regenerate CSS & Data) and any page cache, then check the pages on desktop and phone.

## Backup route (templates only)

1. Do steps 1, 3, 4 above.
2. Site Settings › Global Colors / Global Fonts: add the colours and Plus Jakarta Sans as listed in `PLAN.md`; Site Settings › Layout › Content Width 1216px, Widgets Space 0; Site Settings › Custom CSS: paste `jmt-site.css`.
3. Templates › Saved Templates › Import each `templates/*.json`.
4. Theme Builder: publish `header.json` and `footer.json` with condition Entire Site, `error-404.json` with condition 404 Page.
5. For each page: Pages › Add New with the exact title (Home, Services, Service Areas, About, FAQs, Contact, Request a Quote, Request Received, Privacy Policy, Service Terms) › Edit with Elementor › set Page Layout to **Elementor Full Width** › insert the matching `page-*.json` template from My Templates › Publish. For Request a Quote and Request Received also copy the Page Settings › Custom CSS line `.jmt-mobile-bar{display:none !important}` (the template carries it, but check it after inserting).

## SEO titles and descriptions

| Page | URL | SEO title | Meta description | Index |
|---|---|---|---|---|
| Home | / | Pickup and Delivery for Everyday and Oversized Items \| JMT Enterprise | JMT Enterprise picks up and delivers Marketplace purchases, furniture, appliances, oversized and fragile items across Denver Metro, Boulder and Northern Colorado. Request a quote. | yes |
| Services | /services | Pickup and Delivery Services \| JMT Enterprise | Marketplace pickups, furniture and appliance delivery, heavy and oversized items, fragile and antique pieces, home-to-home transport and small-business deliveries. | yes |
| Service Areas | /service-areas | Service Areas \| JMT Enterprise | JMT Enterprise picks up and delivers across Denver Metro, Boulder and Northern Colorado, including Denver, Aurora, Lakewood, Boulder, Longmont, Fort Collins and Greeley. | yes |
| About | /about | About Us \| JMT Enterprise | About JMT Enterprise LLC, a pickup and delivery service for individuals and businesses across Denver Metro, Boulder and Northern Colorado. | yes |
| FAQs | /faqs | Frequently Asked Questions \| JMT Enterprise | What JMT transports, choosing a vehicle, photos, stairs and loading help, pricing, scheduling and how confirmation works. | yes |
| Contact | /contact | Contact Us \| JMT Enterprise | Call 720-983-4400 or email support@jmtenterprise.net. For a price, send a quote request with your pickup and delivery details. | yes |
| Request a Quote | /request-a-quote | Request a Quote \| JMT Enterprise | Tell JMT Enterprise what you need picked up and delivered. JMT reviews your request and contacts you with a quote. | yes |
| Request Received | /request-received | Request Received \| JMT Enterprise | (none) | **no** |
| Privacy Policy | /privacy-policy | Privacy Policy \| JMT Enterprise | How JMT Enterprise LLC collects and uses the information in quote requests. | **no** (until approved) |
| Service Terms | /service-terms | Service Terms \| JMT Enterprise | Service, cancellation, item restriction and liability terms for JMT Enterprise LLC. | **no** (until approved) |

The footer template carries the same LocalBusiness structured data as the live site, and the FAQs accordion outputs FAQPage structured data (Elementor's FAQ Schema switch).

## Where WordPress differs from the Next.js build

These are limits of Elementor's Form widget and WordPress, decided in `PLAN.md`:

- **Quote form:** 4 steps with the same questions and wording, but no repeating "Add another item / stop" blocks (Item 1 has full detail fields plus an "Other items" box; extra stops go in one box), no conditional fields (Company name is always shown and optional), no review screen (the customer's confirmation email lists every answer instead) and no saved draft. Photo upload keeps the same limits (5 photos, 10 MB each, JPEG/PNG/WebP).
- **Reference number:** Elementor cannot create the JMT-YYMMDD-XXXXX reference, so the thank-you page says the request was emailed to the customer instead of quoting a reference.
- **Spam protection:** Elementor's honeypot field (plus optional reCAPTCHA v3) replaces Turnstile and rate limiting.
- **"Preview only" notices** were a staging feature and are not included.
- **Header phone number** shows from 1280px wide, as on the live site; the mobile menu is Elementor's dropdown (the quote button stays in the mobile quick-action bar).

## Free Elementor fallbacks

Without Pro: build the header and footer with a theme or insert the header/footer templates at the top and bottom of each page; replace the Nav Menu with an Icon List of links; use a form plugin (WPForms, Fluent Forms) for the quote form with the same questions; paste `jmt-site.css` into Appearance › Customize › Additional CSS; the © year falls back to static text.

## Regenerating

```bash
node wordpress/elementor/build.mjs --out <dir>      # build templates, kit zip, CSS, seo.json
node wordpress/elementor/validate.mjs <dir> --fa fa5-free.json   # structural audit
npx next dev -p 3100 & node wordpress/elementor/audit-text.mjs <dir>   # copy audit against the running site
```

Page modules live in `src/pages`, shared blocks in `src/blocks.mjs`, Elementor builders in `src/el.mjs`, site settings in `src/kit.mjs`, CSS in `src/site.css` and `src/css/`.
