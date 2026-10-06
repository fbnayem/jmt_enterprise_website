# Build status, decisions and client inputs

Updated 3 October 2026.

## Decisions taken while building

- **Fresh build.** No existing repository, hosting or CMS was available to inspect, so this follows the brief's proposed stack: Next.js 16 + TypeScript + Tailwind, Supabase, Resend. If the current jmtenterprise.net runs on something worth keeping, revisit before launch.
- **Development adapters** stand in for Supabase and Resend until client accounts exist. Simulated email is written to disk and labelled as such. Production refuses to use them.
- **Timezone** defaults to America/Denver (Mountain Time), inferred only from the 720 area code. It is shown next to the date fields and stored with each request, and is not published as a service area. **Needs confirmation.**
- **Time of day** is a requested window (Flexible, Morning, Afternoon, Evening) with no clock times, so no operating hours are implied.
- **Photos**: JPEG/PNG/WebP, 5 files, 10 MB each, 50 MB total. HEIC is rejected with instructions (conversion not implemented). Stored copies are re-encoded JPEG without EXIF/GPS.
- **Operator access** is the Supabase dashboard plus `npm run ops`. No custom admin dashboard (later phase).
- **Testimonials** section is omitted until genuine reviews are supplied.
- **FAQ answers** are drafted from the brief and need JMT's approval.
- **Brand:** JMT's own full-colour logo (navy, red and white, supplied 4 October 2026, replacing the earlier royal-blue version) is used in the header, footer, favicon, share image and emails. The palette uses the logo's navy for the brand colour and its red for calls to action. Source: `brand-source/jmt-enterprise-logo-client.png`; regenerate assets with `node scripts/brand-assets.mjs`.

## Acceptance checks (brief §9)

| Check | Status |
| --- | --- |
| All services, both customer groups, four vehicles, consistent contact details | Done. Browser test checks every page shows only 720-983-4400 |
| Mobile visitor can submit a complete request without an account | Done. Playwright on a Pixel 7 profile |
| Test cases: Marketplace pickup with stairs, fragile, oversized, business, extra stop, unsure of weight/vehicle | Done across unit, migration and browser tests |
| Photos arrive with the right lead; unsupported, oversized, failed uploads recoverable | Done. Retry/remove per photo, explicit "remove failed photos and continue" |
| Required fields, invalid email, past dates, timezone | Done, client and server |
| Request durably saved; operator can recover it | Done (dev store and SQL migration tested); live Supabase not yet connected |
| DB failure never shows success; email failure keeps lead and retry job | Done (tested) |
| Retries and double clicks do not duplicate requests or emails | Done (idempotency key + DB unique constraint + Resend idempotency key; tested) |
| Internal notification and receipt in a test inbox | **Pending Resend account**: templates verified via simulated outbox |
| Public cannot read leads/photos; no privileged keys in browser code | Done: RLS with no policies, private bucket, service key server-only (no `NEXT_PUBLIC_` secrets) |
| Keyboard, labels, errors, focus, small screens | Done in build; manual accessibility review recommended on final content |
| Links, phone actions, build, sitemap, canonical, indexing, analytics events | Done. Redirect map waits on the current site's URL inventory |
| No placeholders, invented claims or unapproved policy text on the published site | Enforced by `npm run check:launch` (currently failing by design) |

## Test results (this build)

- `npm test`: 30 passed (validation, persistence, idempotency, DB-failure path, uploads and EXIF stripping, ownership checks, outbox retry/permanent failure, webhook signatures, SQL migration in PGlite).
- `npm run test:e2e`: 11 passed (full mobile submission with photo and double-click, access controls on worker/storage/webhook, all nine public pages).
- `npm run lint`, `npm run typecheck`, `npm run build`: clean.

## Client inputs still needed

1. Approved vehicle/item photos (logo and colours received).
2. Confirmed cities, ZIP codes and region; service timezone; hours; any same-day cutoff.
3. Domain/DNS access, the current site's hosting or CMS, and the hosting choice for the new site.
4. Confirmation that support@jmtenterprise.net receives leads, an optional backup recipient, and who follows up.
5. Vehicle capacities, item limits, prohibited items, loading/stairs and specialty-handling rules (for FAQs and terms).
6. Approved company story, any testimonials, and any licensing or insurance claims to show.
7. Privacy policy and service terms wording, cancellation rules, retention periods.
8. Analytics/Search Console access and consent approach; the agreed order scope, revisions and deadline.
9. Approval of the drafted FAQ answers.

## Audit follow-up (3 October 2026)

Done from `docs/AUDIT-AND-IMPROVEMENT-PLAN.md`:

- **P0:** expired form sessions renew themselves (photos from the old session are flagged to add again); honeypot hits are saved as `suspected_spam` with no emails instead of being discarded; the quote form is in the server HTML (no layout shift, `<noscript>` fallback); security headers and CSP; per-address receipt cap, link-free names, plausible phone numbers; GA4 only after the privacy policy is approved, with Consent Mode v2 and an opt-out on the privacy page.
- **Switched off until keys exist:** Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and shared rate limiting (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). Set them before `next build`.
- **P1 form:** elevator asked only with stairs or an upper floor; "same access as pickup" for drop-off; Edit on the review returns to the review; large photos resized on the device; errors cleared when items or stops are removed; dates capped at 12 months; step-view analytics.
- **P1 design:** compact services and vehicles on phones, "at a glance" band removed, repeated "nothing is booked" copy trimmed, contrast fixes, mobile menu focus/Escape/overlay, landmarks, 404 title, page fade removed, lighter background effects on phones, share image.
- **P2:** webhook statuses only move forward; upload-count race closed and upload routes rate limited; screenshots and preview now in git.
- New migration: `20261003000300_spam_status.sql`.

Still open: real photos and other client content (P3), structured data details and per-city pages (need the service area), Search Console and redirect map, cron schedule for the chosen host.
