/**
 * Notification outbox worker. Jobs are created in the same transaction as the
 * lead, so a saved request always has its emails queued. This worker sends
 * them, retries transient failures with backoff, and flags permanent failures
 * for an operator instead of retrying forever. It runs right after a
 * submission (best effort) and on a schedule via /api/cron/notifications,
 * which is the guarantee.
 */
import { getMailer, getStorage, getStore } from "./adapters";
import { serverConfig } from "./config";
import { customerReceiptEmail, internalEmail } from "./email-templates";
import { PermanentMailError, type NotificationJob } from "./types";

export const MAX_ATTEMPTS = 8;
const LOCK_SECONDS = 120;

/** 1m, 2m, 4m, 8m, 16m, 32m, 64m */
export const backoffMs = (attempts: number) => Math.min(60_000 * 2 ** (attempts - 1), 6 * 3600_000);

export async function processOutbox(opts: { limit?: number; requestId?: string } = {}) {
  const store = getStore();
  const jobs = await store.claimDueJobs(opts.limit ?? 20, LOCK_SECONDS, opts.requestId);
  const results: { id: string; status: NotificationJob["status"]; error?: string }[] = [];
  for (const job of jobs) results.push(await sendJob(job));
  return results;
}

async function sendJob(job: NotificationJob) {
  const store = getStore();
  const attempts = job.attempts + 1;
  try {
    const req = await store.getQuoteRequest(job.quoteRequestId);
    if (!req) throw new PermanentMailError("Quote request not found");

    let email;
    if (job.kind === "internal") {
      const storage = getStorage();
      const photoLinks = await Promise.all(
        req.attachments
          .filter((a) => a.storageKey)
          .map(async (a, i) => ({
            name: `Photo ${i + 1} (${a.originalName})`,
            url: await storage.signedReadUrl(a.storageKey!, serverConfig.photoLinkTtlSeconds),
          })),
      );
      email = {
        ...internalEmail(req, photoLinks),
        to: [job.recipient],
        replyTo: req.request.email,
      };
    } else {
      email = { ...customerReceiptEmail(req), to: [job.recipient], replyTo: serverConfig.customerReplyTo };
    }

    const { providerMessageId } = await getMailer().send({
      ...email,
      from: serverConfig.mailFrom,
      idempotencyKey: `jmt-notification-${job.id}`,
    });
    await store.updateJob(job.id, {
      status: "sent",
      attempts,
      providerMessageId,
      lockedUntil: null,
      lastError: null,
    });
    await store.recordEvent({ jobId: job.id, providerMessageId, type: "accepted", detail: null, createdAt: new Date().toISOString() });
    return { id: job.id, status: "sent" as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const permanent = e instanceof PermanentMailError || attempts >= MAX_ATTEMPTS;
    await store.updateJob(job.id, {
      status: permanent ? "failed" : "pending",
      attempts,
      lockedUntil: null,
      lastError: message.slice(0, 500),
      needsAttention: permanent,
      nextAttemptAt: new Date(Date.now() + backoffMs(attempts)).toISOString(),
    });
    await store.recordEvent({ jobId: job.id, providerMessageId: null, type: permanent ? "failed" : "retry_scheduled", detail: message.slice(0, 500), createdAt: new Date().toISOString() });
    console.error(`[outbox] job ${job.id} (${job.kind}) attempt ${attempts} ${permanent ? "FAILED" : "will retry"}: ${message}`);
    return { id: job.id, status: permanent ? ("failed" as const) : ("pending" as const), error: message };
  }
}

/** Deletes photos uploaded to drafts that were never submitted. */
export async function cleanupAbandonedUploads(olderThanHours = 48) {
  const store = getStore();
  const storage = getStorage();
  const stale = await store.listAbandonedAttachments(new Date(Date.now() - olderThanHours * 3600_000));
  for (const a of stale) {
    await storage.remove([a.uploadKey, ...(a.storageKey ? [a.storageKey] : [])]);
    await store.deleteAttachment(a.id);
  }
  return stale.length;
}
