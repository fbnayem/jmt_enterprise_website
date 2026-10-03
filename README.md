# JMT Enterprise LLC website

Pickup-and-delivery website for **JMT Enterprise LLC** (jmtenterprise.net) that turns visitors into complete quote requests. JMT reviews every request, prices it and confirms service manually. Nothing on the site books or reserves a vehicle.

Built with Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Leads go to Supabase Postgres, photos to a private Supabase Storage bucket, email through Resend.

> **Status: staging build.** Client content (photos, service area, hours, timezone, About story, policies) is still pending and is shown as yellow placeholders. See [docs/STATUS.md](docs/STATUS.md).

## Quick start (no accounts needed)

```bash
npm ci
npm run dev        # http://localhost:3000
```

With no credentials the app uses **development adapters**, clearly labelled in code and on screen:

| Integration | Development adapter | Production |
| --- | --- | --- |
| Lead database | `.data/dev-db.json` | Supabase Postgres |
| Photo storage | `.data/uploads`, HMAC-signed expiring URLs | Supabase Storage (private bucket) |
| Email | **Simulated**: written to `.data/outbox/*.html` and `.json`, never sent | Resend |

Development adapters refuse to run when `NODE_ENV=production` unless `ALLOW_DEV_ADAPTERS=true`, so a deployment cannot silently pretend to send email.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint`, `npm run typecheck` | ESLint, TypeScript |
| `npm test` | Unit tests: validation, persistence, duplicates, uploads, email retry, webhook signatures, and the SQL migration in an in-memory Postgres |
| `npm run test:e2e` | Production build + Playwright mobile browser run (full submission with photo) |
| `npm run ops -- <cmd>` | Operator tools: list/show requests, renew photo links, failed emails, retry. See [docs/OPERATING-GUIDE.md](docs/OPERATING-GUIDE.md) |
| `npm run check:launch` | Launch gate: fails while any placeholder content or production secret is missing |

In this cloud environment Playwright uses the preinstalled Chromium: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:e2e`.

## Where things live

```
src/content/site.ts          Business details, services, vehicles, FAQs, pending-content flags (edit copy here)
src/lib/quote/               Shared validation (browser + server), options, timezone helpers
src/lib/server/              Submission, uploads, image checks, outbox worker, adapters, email templates
src/components/quote/        Four-step quote form
src/app/                     Pages and API route handlers
supabase/migrations/         Tables, RLS, transactional submit + job-claim functions, private bucket
scripts/                     ops CLI and launch gate
docs/                        Deployment, operating guide, status and client inputs
```

## Request flow

1. The form gets an anonymous, HMAC-signed **draft token** (`/api/drafts`). Photos upload straight to private storage through short-lived signed URLs scoped to that draft (`/api/uploads/sign`), then the server downloads, checks magic bytes, decodes with size/pixel limits, re-encodes to JPEG (dropping EXIF/GPS) and marks the photo ready (`/api/uploads/complete`).
2. Submit (`/api/quote-requests`) re-validates everything on the server, checks the honeypot and minimum fill time, then saves the request, stops, items, photo links **and notification jobs in one transaction** (`submit_quote_request`). A client-generated idempotency key makes double clicks and timeout retries return the original reference.
3. Success is returned only after that write. The browser goes to `/request-received?ref=JMT-…` (reference only, no personal data; noindex).
4. The outbox worker sends the internal notification (Reply-To = customer) and the customer receipt (Reply-To = support@). It runs right after the response and every 10 minutes via `/api/cron/notifications`. Transient failures back off and retry; permanent failures and bounces are flagged for an operator. Resend webhooks (`/api/webhooks/resend`, Svix-verified) record delivered / delayed / bounced / failed.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to connect real services.
