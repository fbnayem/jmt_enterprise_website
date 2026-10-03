/**
 * DEVELOPMENT ADAPTER — not for production.
 * Stores leads in a local JSON file (.data/dev-db.json). Each mutation reads,
 * changes and atomically rewrites the whole file under an in-process lock, which
 * stands in for the database transaction the Supabase adapter uses.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "../config";
import {
  AttachmentOwnershipError,
  type AttachmentRecord,
  type LeadStore,
  type NewQuoteRequest,
  type NotificationEvent,
  type NotificationJob,
  type NotificationKind,
  type QuoteRequestStatus,
  type StoredQuoteRequest,
  type SubmitResult,
} from "../types";

type Db = {
  requests: (NewQuoteRequest & { status: QuoteRequestStatus })[];
  attachments: AttachmentRecord[];
  jobs: NotificationJob[];
  events: NotificationEvent[];
};

const empty = (): Db => ({ requests: [], attachments: [], jobs: [], events: [] });

export class DevLeadStore implements LeadStore {
  readonly label = "development JSON store (.data/dev-db.json)";
  private file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dir = serverConfig.devDataDir) {
    this.file = path.join(dir, "dev-db.json");
  }

  private async load(): Promise<Db> {
    try {
      return { ...empty(), ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
      throw e;
    }
  }

  private async save(db: Db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2));
    await fs.rename(tmp, this.file);
  }

  /** Serialises read-modify-write cycles so concurrent requests cannot interleave. */
  private tx<T>(fn: (db: Db) => T | Promise<T>, write = true): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.load();
      const result = await fn(db);
      if (write) await this.save(db);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  createAttachment(a: AttachmentRecord) {
    return this.tx((db) => void db.attachments.push(a));
  }
  getAttachment(id: string) {
    return this.tx((db) => db.attachments.find((a) => a.id === id) ?? null, false);
  }
  updateAttachment(id: string, patch: Partial<AttachmentRecord>) {
    return this.tx((db) => {
      const a = db.attachments.find((x) => x.id === id);
      if (a) Object.assign(a, patch);
    });
  }
  deleteAttachment(id: string) {
    return this.tx((db) => {
      db.attachments = db.attachments.filter((a) => a.id !== id);
    });
  }
  listDraftAttachments(draftId: string) {
    return this.tx((db) => db.attachments.filter((a) => a.draftId === draftId), false);
  }

  submitQuoteRequest(input: NewQuoteRequest, attachmentIds: string[]): Promise<SubmitResult> {
    return this.tx((db) => {
      const existing = db.requests.find((r) => r.idempotencyKey === input.idempotencyKey);
      if (existing) return { id: existing.id, reference: existing.reference, duplicate: true };
      if (serverConfig.devStoreFailure) throw new Error("Simulated database failure (DEV_STORE_FAILURE=true)");

      const atts = attachmentIds.map((id) => db.attachments.find((a) => a.id === id));
      for (const a of atts) {
        if (!a || a.draftId !== input.draftId || a.status !== "ready" || a.quoteRequestId) {
          throw new AttachmentOwnershipError("An attached photo is missing or does not belong to this request.");
        }
      }
      db.requests.push({ ...input, status: "awaiting_review" });
      for (const a of atts) a!.quoteRequestId = input.id;
      for (const j of input.jobs) {
        db.jobs.push({
          ...j,
          quoteRequestId: input.id,
          status: "pending",
          attempts: 0,
          nextAttemptAt: input.createdAt,
          lockedUntil: null,
          providerMessageId: null,
          lastError: null,
          needsAttention: false,
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        });
      }
      return { id: input.id, reference: input.reference, duplicate: false };
    });
  }

  getQuoteRequest(idOrReference: string): Promise<StoredQuoteRequest | null> {
    return this.tx((db) => {
      const r = db.requests.find((x) => x.id === idOrReference || x.reference === idOrReference);
      if (!r) return null;
      return {
        ...r,
        attachments: db.attachments.filter((a) => a.quoteRequestId === r.id),
        notifications: db.jobs.filter((j) => j.quoteRequestId === r.id),
      };
    }, false);
  }

  listQuoteRequests(limit: number) {
    return this.tx(
      (db) =>
        [...db.requests]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit)
          .map(({ id, reference, createdAt, request, status }) => ({ id, reference, createdAt, request, status })),
      false,
    );
  }

  setRequestStatus(id: string, status: QuoteRequestStatus) {
    return this.tx((db) => {
      const r = db.requests.find((x) => x.id === id);
      if (r) r.status = status;
    });
  }

  countRecentJobs(kind: NotificationKind, recipient: string, since: Date) {
    return this.tx(
      (db) => db.jobs.filter((j) => j.kind === kind && j.recipient === recipient && new Date(j.createdAt) >= since).length,
      false,
    );
  }

  claimDueJobs(limit: number, lockSeconds: number, onlyRequestId?: string) {
    return this.tx((db) => {
      const now = new Date();
      const due = db.jobs
        .filter(
          (j) =>
            j.status === "pending" &&
            new Date(j.nextAttemptAt) <= now &&
            (!j.lockedUntil || new Date(j.lockedUntil) < now) &&
            (!onlyRequestId || j.quoteRequestId === onlyRequestId),
        )
        .slice(0, limit);
      const lock = new Date(now.getTime() + lockSeconds * 1000).toISOString();
      for (const j of due) {
        j.status = "sending";
        j.lockedUntil = lock;
        j.updatedAt = now.toISOString();
      }
      // Recover jobs whose sender crashed mid-send (lock expired while "sending").
      for (const j of db.jobs) {
        if (j.status === "sending" && j.lockedUntil && new Date(j.lockedUntil) < now && !due.includes(j)) {
          j.status = "pending";
          j.lockedUntil = null;
        }
      }
      return due.map((j) => ({ ...j }));
    });
  }

  updateJob(id: string, patch: Partial<NotificationJob>) {
    return this.tx((db) => {
      const j = db.jobs.find((x) => x.id === id);
      if (j) Object.assign(j, patch, { updatedAt: new Date().toISOString() });
    });
  }
  findJobByProviderId(providerMessageId: string) {
    return this.tx((db) => db.jobs.find((j) => j.providerMessageId === providerMessageId) ?? null, false);
  }
  recordEvent(e: NotificationEvent) {
    return this.tx((db) => void db.events.push(e));
  }
  listJobsNeedingAttention() {
    return this.tx((db) => db.jobs.filter((j) => j.needsAttention), false);
  }
  listAbandonedAttachments(olderThan: Date) {
    return this.tx(
      (db) => db.attachments.filter((a) => !a.quoteRequestId && new Date(a.createdAt) < olderThan),
      false,
    );
  }
}
