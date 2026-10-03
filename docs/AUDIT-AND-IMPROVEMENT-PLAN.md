# JMT Enterprise website: audit and improvement plan

Audited 3 October 2026 against `main` at `fce4d41` ("Modernise the design with motion and transitions") and the client brief of 3 October 2026.

**How it was checked.** I read the code end to end: pages, the quote form, the API routes, the upload, outbox and webhook code, the SQL migrations and the email templates. I ran a production build (`next build`, clean) and served it locally with dev adapters. On that server I ran axe-core (WCAG 2.2 AA plus best-practice rules) on all 11 routes at desktop and Pixel 7 sizes, and Lighthouse mobile on Home, Services and Request a Quote. I also reviewed the screenshots in `docs/screenshots`. I changed no code. The "Build JMT Enterprise website" thread owns the fixes.

**Overall.** The engineering is solid and well ahead of what's usual for a site this size. Submissions are transactional with an outbox, there's idempotency, uploads are scoped to the draft, images are re-encoded to strip EXIF, Supabase has RLS with no policies, the webhook signature is verified, and a launch gate is in place. Most acceptance checks are already met (see the scorecard at the end). The biggest gaps are:

1. Two form bugs that can lose a real lead.
2. A layout-shift problem on the quote page.
3. Missing security headers and bot protection for a public form that sends email.
4. A design that is all text and icons, with no photos or proof. On a phone this makes the home page very long.

Priority key: **P0** must be fixed before launch. **P1** has a high impact on conversions or quality. **P2** is polish. **P3** waits on the client or comes after launch.

---

## P0: fix before launch

### 1. An expired form session can strand the customer *(bug, lead loss)*
`QuoteForm.tsx:180-204` restores the draft token from `sessionStorage`, and `ensureToken()` returns it without checking its age. Draft tokens expire after 24 hours (`draft-token.ts`). Suppose a customer leaves the tab open overnight and then submits. The server replies "Your form session expired. Please refresh the page". But refreshing restores the same expired token, so every retry fails the same way. Photo uploads fail the same way too.
**Fix:** when `/api/quote-requests`, `/api/uploads/sign` or `/api/uploads/complete` returns the session-expired 400, clear the stored token, get a new one and retry once. Photos tied to the old draft can't be re-attached, so tell the customer which photos to add again. Alternatively, store the token's issue time and refresh it ahead of time when it's older than about 20 hours. Add an e2e test that uses a stale token.

### 2. A honeypot hit silently throws away a real lead *(risk, lead loss)*
`submit.ts:28-31` returns a fake success if the hidden `website` field has any value. Browser autofill, password managers and form-filler extensions sometimes fill fields named `website`, even with `autocomplete="off"`. If that happens, a genuine customer sees "request received" and JMT never hears about it.
**Fix:** save honeypot hits as `status = 'suspected_spam'` without sending emails, so an operator can review them with `npm run ops`. Also rename the field to something autofill won't recognise, for example `jmt_hp_x`.

### 3. The quote page has a large layout shift and needs JavaScript to show the form *(performance and accessibility)*
Lighthouse mobile scores Request a Quote at **CLS 0.43** (0.1 is the "good" limit) and Performance 76. The cause: `QuoteForm` calls `useSearchParams()`, so Next renders only the Suspense fallback ("Loading the form…") on the server. When the form mounts, it pushes the footer down by about 2,700px. It also means that with no JavaScript, or a slow script, the visitor sees no form at all.
**Fix:** read `?service=` from `window.location` inside the restore effect, which already runs client-side, and drop `useSearchParams` and the Suspense wrapper so the form's first step is in the static HTML. At minimum, give the fallback a `min-height` that matches step 1. While there, add a `<noscript>` line pointing to the phone number.

### 4. Add security headers *(security)*
Responses currently send none of `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` or `Permissions-Policy`, and they do send `X-Powered-By: Next.js`. `next.config.ts` is empty.
**Fix:** set `poweredByHeader: false` and add `headers()` with HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, and a `Permissions-Policy` that disables camera, mic and geolocation. Add a CSP that allows `self`, the Supabase storage origin (for `connect-src`, because the browser PUTs uploads there) and Google Tag Manager/GA when GA4 is on. Use a nonce, or the hash of the inline `js` class script and the JSON-LD.

### 5. Bot protection and email-abuse limits *(security, sender reputation)*
The form sends a receipt to **any address the visitor types**, and that receipt includes the visitor-supplied `name` ("Hi {name}", `email-templates.ts:112`). A script can use this to send JMT-branded emails with arbitrary text to strangers. That damages the domain's reputation and can get the Resend account suspended. The rate limiter is in-memory per instance (`rate-limit.ts`), so on serverless hosting it barely holds. The only bot checks are the honeypot and a 4-second minimum time.
**Fix:**
- Add Cloudflare Turnstile (free, no puzzles for most people) and verify it on the server in `submitQuoteRequest`. The brief allows "a challenge mechanism if needed".
- Move rate limiting to the host's firewall (for example Vercel WAF rate limits) or a shared store such as Upstash.
- Limit receipts per recipient address, for example 3 per day.
- Remove URLs from `name`, or reject names that contain them, and cap the name at about 80 characters.

### 6. Analytics consent *(compliance, brief §7)*
GA4 loads unconditionally whenever `NEXT_PUBLIC_GA4_ID` is set (`layout.tsx:52-59`), with no consent mode. Also, `anonymize_ip` does nothing in GA4. The brief asks for consent behaviour that matches the approved policy.
**Fix:** decide the approach with the client. A US-only audience usually means GA4 with Consent Mode v2 defaults plus an opt-out link in the privacy policy. Wire that up, and keep GA off until the privacy policy text is approved.

---

## P1: conversion, UX and quality

### Quote form
7. **Shorten step 2.** It has six required choice groups: stairs ×2, elevator ×2, vehicle and loading help. Ask about the elevator only when stairs are "Yes" or "Not sure", or when a floor above 1 is entered. Treat "No stairs" as ground level. This removes up to two required questions for most jobs. Consider collapsing drop-off access behind "Same as pickup / Different".
8. **Make Edit on the review step return to the review.** "Edit" (`QuoteForm.tsx:867`) sends the customer back to the step, and they then have to click Continue through every later step. Add a "Save and return to review" button when the customer arrives from review.
9. **Downscale photos on the device before upload.** Recent phones (48 MP and above) often produce JPEGs over 10 MB, which the form rejects. Resize to about 2400px with a canvas before upload, which the server already re-encodes to anyway. This avoids rejections and makes uploads much faster on mobile data. Optionally convert HEIC on the client with `heic2any` for desktop and Android uploads. iOS Safari already transcodes HEIC to JPEG because of the `accept` list.
10. **Clear stale errors when items or stops are removed.** Errors are keyed by index (`items.2.description`), so removing an item can leave an error shown against the wrong card. Rebuild error keys, or clear the errors under that prefix, on removal. Prefer stable ids to `key={i}`.
11. **Validate the far end of the date range.** Any future date is accepted, including years like 2099. Cap it at about 12 months ahead on both client and server, and reject obvious junk phone numbers (all-same digits, or a 0/1 area code).
12. **Track drop-off by step.** Add an analytics event for each step being viewed (not only completed) so the funnel shows where people stop. The safe-params whitelist already supports this.

### Design and content
13. **Use real images.** Every section is cards, icons and gradients, with no photos of vans, trucks or items. For a moving and delivery service, photos do most of the trust-building. As soon as JMT supplies vehicle and job photos, add a hero photo and one per service. Until then, use licensed stock that's clearly illustrative, as the brief allows. Add an Open Graph image at the same time, because shared links currently have none.
14. **Shorten the home page on phones.** The phone screenshot of the home page is about 30,000px tall. Seven full service cards stack one after another, followed by the who-we-help, how-it-works and vehicle sections. On phones, show the services as a compact two-column grid, or a horizontal scroller linking to /services, and move the "Request a Quote" prompt higher.
15. **Replace the "at a glance" numbers.** "0 accounts needed" and "2 customer groups" read as filler, and the "4 vehicle types" and "7 kinds" counts repeat the sections around them. Drop the band, or swap in real proof once the client provides it: years operating, jobs done, review rating, insured.
16. **Cut repeated copy.** "Nothing is booked until you agree" appears in the hero, the How it works title, its intro, the quote page intro, the review checkbox and the confirmation page. Keep it in the hero, the form acknowledgement and the receipt, and make the other headings about the benefit. Make "Why choose JMT" about real differentiators once the client supplies them. Today's four points mostly describe the form.
17. **Fix colour contrast** (axe, serious). The item marquee text `text-slate-400` on white is 2.63:1. The "Step N of 4" eyebrow `text-accent-600` is 2.88:1. On phones, the logo's "Enterprise" in `text-brand-500` over the translucent header is 3.72:1. Use slate-600, accent-700 or darker, and brand-700 respectively.
18. **Polish the mobile menu.** Close it with Escape, move focus into it when it opens and back to the toggle when it closes, and close it on an outside tap. The logo link's `aria-label` "JMT Enterprise LLC home" doesn't contain its visible text "JMT Enterprise" (Lighthouse label-content-name-mismatch). Change it to "JMT Enterprise home".
19. **Fix the landmarks and the 404 title.** The staging banner and the fixed mobile action bar sit outside landmarks (axe `region`). Wrap them in `<aside aria-label>`. The 404 page uses the default site title. Give it "Page not found".

### Performance
20. Home and Services score 98 and 93. The remaining wins are the ~120 KB of unused JS that Lighthouse flags, and the LCP on Services (3.1s on simulated 4G). Check that `lucide-react` icons are tree-shaken and that the client components (`Header`, `RevealObserver`, `template.tsx` fade) stay small. Also consider dropping the `template.tsx` page fade, which re-animates the whole page on every navigation and delays LCP slightly. The home HTML is 155 KB, mostly RSC payload, which is acceptable.

---

## P2: SEO and robustness

21. **Fill out the structured data.** The `LocalBusiness` JSON-LD has no `areaServed`, `openingHoursSpecification`, `logo`, `image` or `priceRange`, so it qualifies for almost nothing. Add these once the area and hours are confirmed. Use `areaServed` and omit the address if JMT is a service-area business. Add `Service` entries per service on /services.
22. **Use per-service landing pages later.** The brief allows these after launch. Once the service area is confirmed, the strongest local SEO pages will be things like "Facebook Marketplace pickup in {city}" and "Appliance delivery {city}".
23. **Set up Search Console and the redirect map** before switching DNS. The inventory of current jmtenterprise.net URLs is still outstanding, as noted in DEPLOYMENT.md.
24. **Reject out-of-order webhook events.** `email.delivery_delayed` arriving after `email.delivered` downgrades the job to "delayed" (`resend-webhook.ts`). Only allow forward status transitions.
25. **Close upload-count races.** `signUpload` checks "fewer than 5 photos" and then inserts, so parallel requests can exceed 5. The total-size check also uses the client's declared size. The bucket's 10 MB limit and the final `attachmentIds.max(5)` contain the damage, but a DB constraint or count-in-transaction would be cleaner. `uploads/complete` and `uploads/remove` also have no rate limit.
26. **Keep the repo and the shared folder in sync.** `docs/screenshots/`, `preview/` and an empty `public/` exist only in the shared folder, not in git.
27. **Pick a cron schedule for the host.** DEPLOYMENT.md already notes that Vercel Hobby allows only daily crons. If the client won't pay for Pro, use an external scheduler (for example GitHub Actions cron or cron-job.org) calling the worker with the bearer secret every 10 minutes, and drop the `crons` entry so the deploy doesn't fail.

---

## P3: waiting on the client, or after launch

These are already tracked in STATUS.md and block launch through `npm run check:launch`: logo and colours, photos, service area, hours, timezone (America/Denver is a guess), About story, privacy and terms text, FAQ approval, retention periods, and hosting choice. Two client questions would most improve conversion:
- **Testimonials or reviews.** Even three genuine Google reviews would replace the weakest part of the page. Linking a Google Business Profile helps local search too.
- **Response-time commitment.** If JMT can promise something like "we reply within 2 business hours", that is the single most persuasive line on a quote form. It must not be invented.

Later-phase ideas from brief §11 (instant pricing, SMS confirmations, CRM, a dashboard) stay out of scope. The one cheap exception worth raising with the client is an **SMS or WhatsApp click-to-text link** next to "Call", since many Marketplace buyers prefer texting.

---

## Acceptance-check scorecard (brief §9)

| Check | State | Notes |
|---|---|---|
| Services, customer groups, vehicles, contact details consistent | Pass | Checked in code and screenshots |
| Mobile visitor can submit without an account | Pass, with P0 #1 and #3 | Expired session strands the visitor; no-JS shows no form |
| Test cases (Marketplace with stairs, fragile, oversized, business, extra stop, unsure) | Pass | Per STATUS.md test suite |
| Photos arrive with the right lead; failure recovery | Pass | Consider client downscale (#9) to cut rejections |
| Required fields, invalid email, past dates, timezone | Pass | Timezone unconfirmed; add max date (#11) |
| Durably saved, operator recoverable | Pass in dev, untested live | Needs Supabase project |
| DB failure never shows success; email failure retains job | Pass | Except honeypot false positives (#2) |
| No duplicates on retry or double click | Pass | |
| Internal and customer emails in test inbox | Pending | Needs Resend |
| Public can't read leads/photos; no secrets in browser | Pass | Add headers and CSP (#4) |
| Keyboard, labels, errors, focus, small screens | Mostly | Contrast (#17), menu focus (#18), landmarks (#19). No horizontal overflow on any page at 412px |
| Links, phone, build, sitemap, canonical, indexing, analytics | Mostly | Consent (#6), redirect map (#23) |
| No placeholders, invented claims or unapproved text | Blocked on client | Enforced by `check:launch` |

## Suggested order for the build thread

1. P0 #1, #2, #3: form bugs and CLS. Small, contained changes plus tests.
2. P0 #4 and P1 #17-19: headers, contrast, a11y fixes. Mostly config and class changes.
3. P0 #5: Turnstile plus a shared rate limit. Needs a free Cloudflare account, which is the client's decision.
4. P1 #7-12: form UX.
5. P1 #13-16: design and content pass, best done when the client's logo and photos arrive.
6. P2 items alongside the hosting decision.
