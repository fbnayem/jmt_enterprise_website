import type { QuoteRequest } from "@/lib/quote/schema";

export type AttachmentStatus = "pending" | "ready" | "rejected";

export type AttachmentRecord = {
  id: string;
  draftId: string;
  quoteRequestId: string | null;
  status: AttachmentStatus;
  originalName: string;
  declaredType: string;
  declaredSize: number;
  /** Where the browser uploads the raw file. Deleted after validation. */
  uploadKey: string;
  /** Re-encoded, metadata-stripped image. Set once status is "ready". */
  storageKey: string | null;
  finalSize: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export type NotificationKind = "internal" | "customer_receipt";
export type NotificationStatus = "pending" | "sending" | "sent" | "delivered" | "delayed" | "bounced" | "failed";

export type NotificationJob = {
  id: string;
  quoteRequestId: string;
  kind: NotificationKind;
  recipient: string;
  status: NotificationStatus;
  attempts: number;
  nextAttemptAt: string;
  lockedUntil: string | null;
  providerMessageId: string | null;
  lastError: string | null;
  needsAttention: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationEvent = {
  jobId: string | null;
  providerMessageId: string | null;
  type: string;
  detail: string | null;
  createdAt: string;
};

/** Everything persisted for one request, as handed to the store in one call. */
export type NewQuoteRequest = {
  id: string;
  reference: string;
  idempotencyKey: string;
  draftId: string;
  createdAt: string;
  timezone: string;
  acknowledgementVersion: string;
  request: Omit<QuoteRequest, "meta" | "acknowledged">;
  source: QuoteRequest["meta"]["source"];
  jobs: Pick<NotificationJob, "id" | "kind" | "recipient">[];
};

export type StoredQuoteRequest = NewQuoteRequest & {
  status: "awaiting_review";
  attachments: AttachmentRecord[];
  notifications: NotificationJob[];
};

export type SubmitResult = { id: string; reference: string; duplicate: boolean };

export class AttachmentOwnershipError extends Error {}

export interface LeadStore {
  readonly label: string;
  createAttachment(a: AttachmentRecord): Promise<void>;
  getAttachment(id: string): Promise<AttachmentRecord | null>;
  updateAttachment(id: string, patch: Partial<AttachmentRecord>): Promise<void>;
  deleteAttachment(id: string): Promise<void>;
  listDraftAttachments(draftId: string): Promise<AttachmentRecord[]>;
  /**
   * Atomically: reject if idempotencyKey already exists (return the original),
   * verify attachments belong to the draft and are ready, insert the request,
   * stops, items, link attachments and create notification jobs.
   */
  submitQuoteRequest(input: NewQuoteRequest, attachmentIds: string[]): Promise<SubmitResult>;
  getQuoteRequest(idOrReference: string): Promise<StoredQuoteRequest | null>;
  listQuoteRequests(limit: number): Promise<Pick<StoredQuoteRequest, "id" | "reference" | "createdAt" | "request">[]>;
  /** Claims due jobs for sending (locks them for `lockSeconds`). */
  claimDueJobs(limit: number, lockSeconds: number, onlyRequestId?: string): Promise<NotificationJob[]>;
  updateJob(id: string, patch: Partial<NotificationJob>): Promise<void>;
  findJobByProviderId(providerMessageId: string): Promise<NotificationJob | null>;
  recordEvent(e: NotificationEvent): Promise<void>;
  listJobsNeedingAttention(): Promise<NotificationJob[]>;
  listAbandonedAttachments(olderThan: Date): Promise<AttachmentRecord[]>;
}

export interface PhotoStorage {
  readonly label: string;
  /** Returns a short-lived URL the browser can PUT the raw file to. */
  createUploadUrl(key: string, contentType: string): Promise<{ url: string; headers: Record<string, string> }>;
  read(key: string): Promise<Buffer | null>;
  write(key: string, data: Buffer, contentType: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  /** Time-limited private read link for operators. */
  signedReadUrl(key: string, ttlSeconds: number): Promise<string>;
}

export type OutgoingEmail = {
  to: string[];
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export class PermanentMailError extends Error {}

export interface Mailer {
  readonly label: string;
  send(email: OutgoingEmail): Promise<{ providerMessageId: string }>;
}
