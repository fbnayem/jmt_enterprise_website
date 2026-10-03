# Operating guide

Email to support@jmtenterprise.net is the working channel. The database is the recovery copy: every request is saved before the customer sees the confirmation screen.

Run the commands below from the project folder with the production environment variables loaded (for example `vercel env pull .env.local` then `set -a; . ./.env.local; set +a`). Without them they run against the local development store.

## Find a request

```bash
npm run ops -- list 20                 # newest first
npm run ops -- show JMT-261003-7KQ4M   # everything, including email status and photo records
```

Or open Supabase → Table editor → `quote_requests` (plus `route_stops`, `items`, `attachments`, `notification_jobs`). Only signed-in Supabase team members can see this data.

## Photo links expired

Internal emails contain private photo links valid for about 7 days. To get fresh links:

```bash
npm run ops -- photo-links JMT-261003-7KQ4M
```

## An email did not arrive

```bash
npm run ops -- failed                  # anything bounced, failed or out of retries
npm run ops -- retry JMT-261003-7KQ4M  # re-queue and send that request's failed emails now
```

- Transient errors retry automatically with backoff (up to 8 attempts over a few hours).
- A **bounced customer receipt** usually means the customer mistyped their email. Call them on the phone number in the request.
- "Sent" means Resend accepted the message; "delivered" comes from Resend's webhook. Check the Resend dashboard for the message if needed.

## Changing public content

Business details, services, vehicles, FAQs and the pending-content flags are in `src/content/site.ts`. Policy pages are `src/app/privacy-policy/page.tsx` and `src/app/service-terms/page.tsx`. Change, run `npm test && npm run build`, and deploy. When a placeholder is replaced, set its flag in `pendingContent` to `false`.

## Retention and deletion

**Not yet decided by JMT.** Once decided, delete old rows from `quote_requests` (stops, items and jobs cascade) and remove their photos from the `quote-photos` bucket (`photos/<draft id>/…`, listed in `attachments.storage_key`). Abandoned uploads from unfinished forms are removed automatically after 48 hours.

## Status values

`quote_requests.status` starts as `awaiting_review`. The other values (`quoted`, `confirmed`, `declined`, `closed`) exist so JMT can keep a simple follow-up record in Supabase and compare lead sources with real jobs.
