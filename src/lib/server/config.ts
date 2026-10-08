import os from "node:os";
import path from "node:path";

/**
 * Server configuration. Real integrations are used when their credentials are
 * present. Without them the app falls back to clearly labelled DEVELOPMENT
 * adapters (local JSON store, local files, emails written to disk). Those
 * adapters refuse to run in production unless ALLOW_DEV_ADAPTERS=true, or the
 * build is a Vercel demo that is not the launched site, so the live site can
 * never silently pretend to send email.
 */
const env = process.env;

/** A Vercel deployment that is not the approved live site (it shows "Preview only" notices). */
const isVercelDemo = Boolean(env.VERCEL) && env.NEXT_PUBLIC_SITE_ENV !== "production";
const vercelUrl = env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

export const serverConfig = {
  supabaseUrl: env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: env.SUPABASE_PHOTO_BUCKET ?? "quote-photos",
  resendApiKey: env.RESEND_API_KEY ?? "",
  resendWebhookSecret: env.RESEND_WEBHOOK_SECRET ?? "",
  mailFrom: env.MAIL_FROM ?? "JMT Enterprise <requests@jmtenterprise.net>",
  internalRecipients: (env.LEAD_NOTIFICATION_TO ?? "support@jmtenterprise.net")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  customerReplyTo: env.CUSTOMER_REPLY_TO ?? "support@jmtenterprise.net",
  uploadTokenSecret: env.UPLOAD_TOKEN_SECRET ?? "",
  cronSecret: env.CRON_SECRET ?? "",
  siteUrl: env.NEXT_PUBLIC_SITE_URL ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000"),
  /** Signed photo links in the internal email stay valid this long. */
  photoLinkTtlSeconds: Number(env.PHOTO_LINK_TTL_SECONDS ?? 7 * 24 * 3600),
  // Vercel functions can only write to the temp directory.
  devDataDir: env.DEV_DATA_DIR ?? (env.VERCEL ? path.join(os.tmpdir(), "jmt-data") : path.join(process.cwd(), ".data")),
  /** Development only: force simulated email failures ("transient" | "permanent"). */
  devMailFailure: env.DEV_MAIL_FAILURE ?? "",
  /** Development only: make the dev store throw on submit to test the failure path. */
  devStoreFailure: env.DEV_STORE_FAILURE === "true",
  minFormSeconds: Number(env.MIN_FORM_SECONDS ?? 4),
  /** Cloudflare Turnstile. Off until both keys are set (the site key is read by the browser). */
  turnstileSecretKey: env.TURNSTILE_SECRET_KEY ?? "",
  /** At most this many customer receipts go to one email address per 24 hours. */
  maxReceiptsPerRecipientPerDay: Number(env.MAX_RECEIPTS_PER_RECIPIENT_PER_DAY ?? 3),
};

export const usingSupabase = () => Boolean(serverConfig.supabaseUrl && serverConfig.supabaseServiceRoleKey);
export const usingResend = () => Boolean(serverConfig.resendApiKey);

export function assertDevAdaptersAllowed(what: string) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_ADAPTERS !== "true" && !isVercelDemo) {
    throw new Error(
      `${what} is not configured and development adapters are disabled in production. ` +
        `Set the required environment variables (see .env.example).`,
    );
  }
}

export function uploadSecret(): string {
  if (serverConfig.uploadTokenSecret) return serverConfig.uploadTokenSecret;
  assertDevAdaptersAllowed("UPLOAD_TOKEN_SECRET");
  return "development-only-upload-secret-do-not-use-in-production";
}
