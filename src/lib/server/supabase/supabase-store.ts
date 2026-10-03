/**
 * Production lead store backed by Supabase Postgres (service-role key, server only).
 * Requires the migrations in supabase/migrations.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverConfig } from "../config";
import {
  AttachmentOwnershipError,
  type AttachmentRecord,
  type LeadStore,
  type NewQuoteRequest,
  type NotificationEvent,
  type NotificationJob,
  type StoredQuoteRequest,
  type SubmitResult,
} from "../types";

let client: SupabaseClient | null = null;
export function supabaseAdmin(): SupabaseClient {
  client ??= createClient(serverConfig.supabaseUrl, serverConfig.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

type Row = Record<string, unknown>;

const toAttachment = (r: Row): AttachmentRecord => ({
  id: r.id as string,
  draftId: r.draft_id as string,
  quoteRequestId: (r.quote_request_id as string) ?? null,
  status: r.status as AttachmentRecord["status"],
  originalName: r.original_name as string,
  declaredType: r.declared_type as string,
  declaredSize: Number(r.declared_size),
  uploadKey: r.upload_key as string,
  storageKey: (r.storage_key as string) ?? null,
  finalSize: r.final_size == null ? null : Number(r.final_size),
  width: (r.width as number) ?? null,
  height: (r.height as number) ?? null,
  createdAt: r.created_at as string,
});

const fromAttachment = (a: Partial<AttachmentRecord>): Row => {
  const map: Record<string, string> = {
    id: "id", draftId: "draft_id", quoteRequestId: "quote_request_id", status: "status",
    originalName: "original_name", declaredType: "declared_type", declaredSize: "declared_size",
    uploadKey: "upload_key", storageKey: "storage_key", finalSize: "final_size", width: "width",
    height: "height", createdAt: "created_at",
  };
  return Object.fromEntries(Object.entries(a).map(([k, v]) => [map[k] ?? k, v]));
};

const toJob = (r: Row): NotificationJob => ({
  id: r.id as string,
  quoteRequestId: r.quote_request_id as string,
  kind: r.kind as NotificationJob["kind"],
  recipient: r.recipient as string,
  status: r.status as NotificationJob["status"],
  attempts: r.attempts as number,
  nextAttemptAt: r.next_attempt_at as string,
  lockedUntil: (r.locked_until as string) ?? null,
  providerMessageId: (r.provider_message_id as string) ?? null,
  lastError: (r.last_error as string) ?? null,
  needsAttention: r.needs_attention as boolean,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

const fromJob = (j: Partial<NotificationJob>): Row => {
  const map: Record<string, string> = {
    status: "status", attempts: "attempts", nextAttemptAt: "next_attempt_at", lockedUntil: "locked_until",
    providerMessageId: "provider_message_id", lastError: "last_error", needsAttention: "needs_attention",
  };
  return Object.fromEntries(Object.entries(j).filter(([k]) => map[k]).map(([k, v]) => [map[k], v]));
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

export class SupabaseLeadStore implements LeadStore {
  readonly label = "Supabase Postgres";
  private get db() {
    return supabaseAdmin();
  }

  async createAttachment(a: AttachmentRecord) {
    check(await this.db.from("attachments").insert(fromAttachment(a)));
  }
  async getAttachment(id: string) {
    const data = check(await this.db.from("attachments").select("*").eq("id", id).maybeSingle());
    return data ? toAttachment(data) : null;
  }
  async updateAttachment(id: string, patch: Partial<AttachmentRecord>) {
    check(await this.db.from("attachments").update(fromAttachment(patch)).eq("id", id));
  }
  async deleteAttachment(id: string) {
    check(await this.db.from("attachments").delete().eq("id", id));
  }
  async listDraftAttachments(draftId: string) {
    return (check(await this.db.from("attachments").select("*").eq("draft_id", draftId)) ?? []).map(toAttachment);
  }

  async submitQuoteRequest(input: NewQuoteRequest, attachmentIds: string[]): Promise<SubmitResult> {
    const { data, error } = await this.db.rpc("submit_quote_request", { p: input, p_attachment_ids: attachmentIds });
    if (error) {
      if (error.message.includes("ATTACHMENT_OWNERSHIP")) {
        throw new AttachmentOwnershipError("An attached photo is missing or does not belong to this request.");
      }
      throw new Error(`Supabase: ${error.message}`);
    }
    return data as SubmitResult;
  }

  async getQuoteRequest(idOrReference: string): Promise<StoredQuoteRequest | null> {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrReference);
    const r = check(
      await this.db.from("quote_requests").select("*").eq(isUuid ? "id" : "reference", idOrReference).maybeSingle(),
    ) as Row | null;
    if (!r) return null;
    const [atts, jobs] = await Promise.all([
      this.db.from("attachments").select("*").eq("quote_request_id", r.id),
      this.db.from("notification_jobs").select("*").eq("quote_request_id", r.id),
    ]);
    return {
      id: r.id as string,
      reference: r.reference as string,
      idempotencyKey: r.idempotency_key as string,
      draftId: r.draft_id as string,
      createdAt: r.created_at as string,
      timezone: r.timezone as string,
      acknowledgementVersion: r.acknowledgement_version as string,
      request: r.payload as StoredQuoteRequest["request"],
      source: r.source as StoredQuoteRequest["source"],
      status: r.status as StoredQuoteRequest["status"],
      jobs: [],
      attachments: (check(atts) ?? []).map(toAttachment),
      notifications: (check(jobs) ?? []).map(toJob),
    };
  }

  async listQuoteRequests(limit: number) {
    const rows = check(
      await this.db.from("quote_requests").select("id, reference, created_at, status, payload").order("created_at", { ascending: false }).limit(limit),
    ) as Row[];
    return rows.map((r) => ({
      id: r.id as string,
      reference: r.reference as string,
      createdAt: r.created_at as string,
      request: r.payload as StoredQuoteRequest["request"],
      status: r.status as StoredQuoteRequest["status"],
    }));
  }

  async setRequestStatus(id: string, status: StoredQuoteRequest["status"]) {
    check(await this.db.from("quote_requests").update({ status }).eq("id", id));
  }

  async countRecentJobs(kind: NotificationJob["kind"], recipient: string, since: Date) {
    const { count, error } = await this.db
      .from("notification_jobs")
      .select("id", { count: "exact", head: true })
      .eq("kind", kind)
      .eq("recipient", recipient)
      .gte("created_at", since.toISOString());
    if (error) throw new Error(`Supabase: ${error.message}`);
    return count ?? 0;
  }

  async claimDueJobs(limit: number, lockSeconds: number, onlyRequestId?: string) {
    const rows = check(
      await this.db.rpc("claim_notification_jobs", { p_limit: limit, p_lock_seconds: lockSeconds, p_request: onlyRequestId ?? null }),
    ) as Row[];
    return (rows ?? []).map(toJob);
  }
  async updateJob(id: string, patch: Partial<NotificationJob>) {
    check(await this.db.from("notification_jobs").update({ ...fromJob(patch), updated_at: new Date().toISOString() }).eq("id", id));
  }
  async findJobByProviderId(providerMessageId: string) {
    const r = check(await this.db.from("notification_jobs").select("*").eq("provider_message_id", providerMessageId).maybeSingle());
    return r ? toJob(r) : null;
  }
  async recordEvent(e: NotificationEvent) {
    check(
      await this.db.from("notification_events").insert({
        job_id: e.jobId, provider_message_id: e.providerMessageId, type: e.type, detail: e.detail, created_at: e.createdAt,
      }),
    );
  }
  async listJobsNeedingAttention() {
    return (check(await this.db.from("notification_jobs").select("*").eq("needs_attention", true)) ?? []).map(toJob);
  }
  async listAbandonedAttachments(olderThan: Date) {
    return (
      check(await this.db.from("attachments").select("*").is("quote_request_id", null).lt("created_at", olderThan.toISOString())) ?? []
    ).map(toAttachment);
  }
}
