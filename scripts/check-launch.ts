/**
 * Launch gate. Fails while any client content is still a staging placeholder,
 * so a production deploy cannot ship invented or missing details.
 */
import { business, pendingContent } from "../src/content/site";

const problems = Object.entries(pendingContent)
  .filter(([, pending]) => pending)
  .map(([k]) => `content pending: ${k}`);
if (!business.timezoneConfirmed) problems.push("service timezone not confirmed");
if (!business.serviceArea) problems.push("service area not set");
if (!business.hours) problems.push("hours not set");

for (const v of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "UPLOAD_TOKEN_SECRET", "CRON_SECRET", "MAIL_FROM"]) {
  if (!process.env[v]) problems.push(`env missing: ${v}`);
}
if (process.env.NEXT_PUBLIC_SITE_ENV !== "production") problems.push("NEXT_PUBLIC_SITE_ENV is not 'production'");
if (process.env.ALLOW_DEV_ADAPTERS === "true") problems.push("ALLOW_DEV_ADAPTERS must not be set in production");

if (problems.length) {
  console.error(`Not ready to launch (${problems.length}):\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("Launch checks passed.");
