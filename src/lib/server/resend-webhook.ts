/**
 * Resend delivers webhooks through Svix. Verify the signature before trusting
 * an event: HMAC-SHA256 over "{svix-id}.{svix-timestamp}.{body}" with the
 * base64 secret that follows the "whsec_" prefix.
 */
import crypto from "node:crypto";
import { getStore } from "./adapters";
import type { NotificationJob } from "./types";

export function verifySvixSignature(
  secret: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  body: string,
  now = Date.now(),
): boolean {
  if (!secret || !headers.id || !headers.timestamp || !headers.signature) return false;
  const ts = Number(headers.timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${headers.id}.${headers.timestamp}.${body}`).digest();
  return headers.signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

const STATUS_BY_EVENT: Record<string, { status: NotificationJob["status"]; attention: boolean }> = {
  "email.delivered": { status: "delivered", attention: false },
  "email.delivery_delayed": { status: "delayed", attention: false },
  "email.bounced": { status: "bounced", attention: true },
  "email.failed": { status: "failed", attention: true },
  "email.complained": { status: "delivered", attention: true },
};

export async function handleResendEvent(event: { type?: string; data?: { email_id?: string; bounce?: unknown } }) {
  const type = event.type ?? "unknown";
  const providerId = event.data?.email_id ?? null;
  const store = getStore();
  const job = providerId ? await store.findJobByProviderId(providerId) : null;
  await store.recordEvent({
    jobId: job?.id ?? null,
    providerMessageId: providerId,
    type,
    detail: event.data?.bounce ? JSON.stringify(event.data.bounce).slice(0, 500) : null,
    createdAt: new Date().toISOString(),
  });
  const mapped = STATUS_BY_EVENT[type];
  if (job && mapped) {
    await store.updateJob(job.id, {
      status: mapped.status,
      needsAttention: job.needsAttention || mapped.attention,
      ...(mapped.attention ? { lastError: `Provider reported ${type}` } : {}),
    });
  }
  return { matched: Boolean(job) };
}
