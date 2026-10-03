import crypto from "node:crypto";
import { business } from "@/content/site";
import { makeReference } from "@/lib/quote/reference";
import { issuesToErrors, normalizePhone, quoteRequestSchema } from "@/lib/quote/schema";
import { getStore } from "./adapters";
import { serverConfig } from "./config";
import { verifyDraftToken } from "./draft-token";
import { verifyTurnstile } from "./turnstile";
import { AttachmentOwnershipError, type NewQuoteRequest } from "./types";

export type SubmitOutcome =
  | { ok: true; reference: string; requestId: string; duplicate: boolean; suspectedSpam?: boolean }
  | { ok: false; status: 400 | 409 | 422 | 500; error: string; code?: "session_expired" | "challenge_failed"; fieldErrors?: Record<string, string> };

/**
 * Validates and durably saves a quote request with its notification jobs.
 * Success is returned only after the store confirms the write; any store
 * failure becomes an error response, never a receipt.
 */
export async function submitQuoteRequest(body: unknown, now = new Date(), ip?: string): Promise<SubmitOutcome> {
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 422, error: "Some details need attention.", fieldErrors: issuesToErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  const { meta, acknowledged: _ack, ...request } = data;

  // A filled honeypot is usually a bot, but browser autofill can fill it for a
  // real customer. Save the request for review without sending any email.
  const suspectedSpam = Boolean(meta.website);

  const draft = verifyDraftToken(meta.draftToken, now.getTime());
  if (!draft) {
    return { ok: false, status: 400, code: "session_expired", error: "Your form session expired. Please try again; your answers are kept." };
  }
  if (!suspectedSpam && !(await verifyTurnstile(meta.turnstileToken, ip))) {
    return { ok: false, status: 400, code: "challenge_failed", error: "Please complete the security check and send again." };
  }
  if (now.getTime() - draft.issuedAt < serverConfig.minFormSeconds * 1000) {
    return { ok: false, status: 400, error: "That was very quick. Please check your details and submit again." };
  }

  const id = crypto.randomUUID();
  const input: NewQuoteRequest = {
    id,
    reference: makeReference(now),
    idempotencyKey: meta.idempotencyKey,
    draftId: draft.draftId,
    createdAt: now.toISOString(),
    timezone: business.timezone,
    acknowledgementVersion: meta.acknowledgementVersion,
    request: { ...request, phone: normalizePhone(request.phone), email: request.email.toLowerCase() },
    source: meta.source,
    jobs: [],
  };

  try {
    const store = getStore();
    if (!suspectedSpam) {
      const email = request.email.toLowerCase();
      input.jobs.push(...serverConfig.internalRecipients.map((recipient) => ({ id: crypto.randomUUID(), kind: "internal" as const, recipient })));
      // Cap receipts per address so the form can't be used to send JMT-branded
      // email to strangers. JMT still gets the lead.
      const since = new Date(now.getTime() - 24 * 3600 * 1000);
      if ((await store.countRecentJobs("customer_receipt", email, since)) < serverConfig.maxReceiptsPerRecipientPerDay) {
        input.jobs.push({ id: crypto.randomUUID(), kind: "customer_receipt", recipient: email });
      }
    }
    const result = await store.submitQuoteRequest(input, [...new Set(request.attachmentIds)]);
    if (suspectedSpam && !result.duplicate) await store.setRequestStatus(result.id, "suspected_spam");
    return { ok: true, reference: result.reference, requestId: result.id, duplicate: result.duplicate, suspectedSpam };
  } catch (e) {
    if (e instanceof AttachmentOwnershipError) {
      return { ok: false, status: 409, error: "One of your photos could not be attached. Remove it and try again, or continue without photos." };
    }
    // Log without personal details.
    console.error(`[submit] failed to save request ${input.reference}: ${e instanceof Error ? e.message : e}`);
    return { ok: false, status: 500, error: `We could not save your request. Please try again, or call ${business.phoneDisplay}.` };
  }
}
