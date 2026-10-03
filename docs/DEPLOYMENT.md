# Deployment

Hosting is **not yet chosen** (client decision). Any host that runs Next.js 16 on Node 20.9+, supports server secrets and can call an HTTPS endpoint on a schedule will work. `vercel.json` already declares the cron for Vercel (a 10-minute schedule needs a paid plan; Hobby allows daily, which is too slow for retries).

Do not create paid accounts or deploy without the agreed approval. Use client-controlled accounts.

## 1. Supabase

1. Create a project (client-owned). Note the project URL and the **service role** key.
2. Apply the migrations in order (`supabase db push` with the Supabase CLI, or paste each file into the SQL editor):
   - `supabase/migrations/20261003000100_quote_requests.sql`: tables, RLS on with no policies, `submit_quote_request` and `claim_notification_jobs`.
   - `supabase/migrations/20261003000200_photo_bucket.sql`: private `quote-photos` bucket, 10 MB limit, JPEG/PNG/WebP only.
3. Confirm in the dashboard: every table shows RLS enabled and the bucket is **not public**.

## 2. Resend

1. Add and verify a sending domain JMT controls (for example `jmtenterprise.net` or a subdomain such as `mail.jmtenterprise.net`). Add only the DNS records Resend lists (SPF include, DKIM CNAMEs, optional DMARC). **Do not remove or replace existing MX or SPF records** that deliver support@jmtenterprise.net; merge SPF includes into the existing record.
2. Create an API key with sending access.
3. Add a webhook to `https://<site>/api/webhooks/resend` for `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.complained`. Copy its signing secret.

## 3. Environment variables

Set everything in `.env.example` on the host. Required in production:
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_ENV=production` (live site only), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`, `LEAD_NOTIFICATION_TO`, `UPLOAD_TOKEN_SECRET`, `CRON_SECRET`.

Preview/staging deployments: keep `NEXT_PUBLIC_SITE_ENV` unset (pages are `noindex`, robots.txt disallows all) and point `LEAD_NOTIFICATION_TO` at a **test inbox**.

## 4. Scheduled worker

Call `GET /api/cron/notifications` with header `Authorization: Bearer $CRON_SECRET` every 5–10 minutes. It sends due emails, retries failures and deletes photos from forms abandoned for 48 hours.

## 5. Before replacing the live site

- Inventory current jmtenterprise.net URLs and add redirects in `next.config.ts` (`redirects()`) for any that change.
- `npm run check:launch` must pass.
- Smoke test on production: submit one real request to the live inbox, confirm the internal email (with photo link) and the receipt arrive, then mark that lead as a test in Supabase.
- Submit the sitemap in Search Console.

## Rollback

- Code: redeploy the previous successful deployment (host dashboard "promote/rollback", or redeploy the previous git tag).
- Database: migrations only add objects. Leads are never deleted by deploys. If a rollback is needed after a schema change, restore from Supabase's daily backup or point-in-time recovery.
- Email: if Resend is unavailable, leads keep saving and jobs queue; they send when it recovers (or run `npm run ops -- send-due`).
