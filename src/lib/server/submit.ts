import crypto from "node:crypto";
import { business } from "@/content/site";
import { makeReference } from "@/lib/quote/reference";
import { issuesToErrors, normalizePhone, quoteRequestSchema } from "@/lib/quote/schema";
import { getStore } from "./adapters";
import { serverConfig } from "./config";
import { verifyDraftToken } from "./draft-token";
import { AttachmentOwnershipError, type NewQuoteRequest } from "./types";

export type SubmitOutcome =
  | { ok: true; reference: string; requestId: string; duplicate: boolean }
  | { ok: false; status: 400 | 409 | 422 | 500; error: string; fieldErrors?: Record<string, string> };

/**
 * Validates and durably saves a quote request with its notification jobs.
 * Success is returned only after the store confirms the write; any store
 * failure becomes an error response, never a receipt.
 */
export async function submitQuoteRequest(body: unknown, now = new Date()): Promise<SubmitOutcome> {
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 422, error: "Some details need attention.", fieldErrors: issuesToErrors(parsed.error.issues) };
  }
  const data = parsed.data;
  const { meta, acknowledged: _ack, ...request } = data;

  if (meta.website) {
    // Honeypot filled in: pretend success without saving or emailing.
    return { ok: true, reference: makeReference(now), requestId: "discarded", duplicate: false };
  }

  const draft = verifyDraftToken(meta.draftToken, now.getTime());
  if (!draft) {
    return { ok: false, status: 400, error: "Your form session expired. Please refresh the page; your answers are kept on this device." };
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
    jobs: [
      ...serverConfig.internalRecipients.map((recipient) => ({ id: crypto.randomUUID(), kind: "internal" as const, recipient })),
      { id: crypto.randomUUID(), kind: "customer_receipt" as const, recipient: request.email.toLowerCase() },
    ],
  };

  try {
    const result = await getStore().submitQuoteRequest(input, [...new Set(request.attachmentIds)]);
    return { ok: true, reference: result.reference, requestId: result.id, duplicate: result.duplicate };
  } catch (e) {
    if (e instanceof AttachmentOwnershipError) {
      return { ok: false, status: 409, error: "One of your photos could not be attached. Remove it and try again, or continue without photos." };
    }
    // Log without personal details.
    console.error(`[submit] failed to save request ${input.reference}: ${e instanceof Error ? e.message : e}`);
    return { ok: false, status: 500, error: `We could not save your request. Please try again, or call ${business.phoneDisplay}.` };
  }
}
