import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { beforeEach, describe, expect, it } from "vitest";
import { getStore, setAdapters } from "@/lib/server/adapters";
import { serverConfig } from "@/lib/server/config";
import { DevMailer } from "@/lib/server/dev/dev-mailer";
import { DevPhotoStorage } from "@/lib/server/dev/dev-storage";
import { DevLeadStore } from "@/lib/server/dev/dev-store";
import { issueDraftToken } from "@/lib/server/draft-token";
import { MAX_ATTEMPTS, processOutbox } from "@/lib/server/outbox";
import { submitQuoteRequest } from "@/lib/server/submit";
import { completeUpload, signUpload } from "@/lib/server/uploads";
import { validPayload } from "./helpers";

let dir: string;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(serverConfig.devDataDir, "case-"));
  serverConfig.devDataDir = dir;
  serverConfig.devStoreFailure = false;
  serverConfig.devMailFailure = "";
  setAdapters({ store: new DevLeadStore(dir), storage: new DevPhotoStorage(), mailer: new DevMailer() });
});

const jpeg = (opts: { exif?: boolean } = {}) => {
  let img = sharp({ create: { width: 800, height: 600, channels: 3, background: "#884422" } }).jpeg();
  if (opts.exif) img = img.withExif({ IFD0: { Make: "TestCam" }, IFD3: { GPSLatitude: "39/1 44/1 0/1", GPSLatitudeRef: "N" } });
  return img.toBuffer();
};

async function uploadPhoto(draftToken: string, data: Buffer, type = "image/jpeg") {
  const signed = await signUpload({ draftToken, name: "sofa.jpg", type, size: data.length });
  if (!signed.ok) throw new Error(signed.error);
  const key = new URL(signed.uploadUrl).searchParams.get("key")!;
  await new DevPhotoStorage().write(key, data); // stands in for the browser PUT
  return { id: signed.attachmentId, complete: () => completeUpload({ draftToken, attachmentId: signed.attachmentId }) };
}

describe("submission persistence", () => {
  it("saves the complete request with its notification jobs before returning a reference", async () => {
    const out = await submitQuoteRequest(validPayload());
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.reference).toMatch(/^JMT-\d{6}-[A-Z0-9]{5}$/);
    const saved = await getStore().getQuoteRequest(out.reference);
    expect(saved?.request.email).toBe("customer@example.com");
    expect(saved?.request.phone).toBe("720-555-0100");
    expect(saved?.status).toBe("awaiting_review");
    expect(saved?.notifications.map((n) => n.kind).sort()).toEqual(["customer_receipt", "internal"]);
    expect(saved?.notifications.find((n) => n.kind === "internal")?.recipient).toBe("support@jmtenterprise.net");
  });

  it("returns the original reference and creates nothing new for a retried or double-clicked submit", async () => {
    const payload = validPayload();
    const [a, b] = await Promise.all([submitQuoteRequest(payload), submitQuoteRequest(payload)]);
    const c = await submitQuoteRequest(payload);
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;
    expect(new Set([a.reference, b.reference, c.reference]).size).toBe(1);
    expect([a.duplicate, b.duplicate, c.duplicate].filter(Boolean)).toHaveLength(2);
    expect(await getStore().listQuoteRequests(10)).toHaveLength(1);
    const saved = await getStore().getQuoteRequest(a.reference);
    expect(saved?.notifications).toHaveLength(2);
  });

  it("never reports success when the database write fails", async () => {
    serverConfig.devStoreFailure = true;
    const out = await submitQuoteRequest(validPayload());
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.status).toBe(500);
  });

  it("rejects an expired or forged form session", async () => {
    const out = await submitQuoteRequest(validPayload({}, { draftId: "x", token: "forged.123.abc" }));
    expect(out.ok).toBe(false);
  });

  it("silently discards honeypot submissions without saving", async () => {
    const p = validPayload();
    p.meta.website = "http://spam.example";
    const out = await submitQuoteRequest(p);
    expect(out.ok).toBe(true);
    expect(await getStore().listQuoteRequests(10)).toHaveLength(0);
  });

  it("returns field errors and saves nothing for invalid input", async () => {
    const out = await submitQuoteRequest(validPayload({ email: "bad" }));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.fieldErrors?.email).toBeDefined();
    expect(await getStore().listQuoteRequests(10)).toHaveLength(0);
  });
});

describe("photo uploads", () => {
  it("validates, re-encodes and strips location metadata, then attaches to the right lead", async () => {
    const draft = issueDraftToken(Date.now() - 10_000);
    const raw = await jpeg({ exif: true });
    expect((await sharp(raw).metadata()).exif).toBeDefined();
    const up = await uploadPhoto(draft.token, raw);
    expect((await up.complete()).ok).toBe(true);

    const att = await getStore().getAttachment(up.id);
    const stored = await new DevPhotoStorage().read(att!.storageKey!);
    expect((await sharp(stored!).metadata()).exif).toBeUndefined();

    const out = await submitQuoteRequest(validPayload({ attachmentIds: [up.id] }, draft));
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const saved = await getStore().getQuoteRequest(out.reference);
    expect(saved?.attachments.map((a) => a.id)).toEqual([up.id]);
  });

  it("rejects a file whose content is not an image even if it claims to be a JPEG", async () => {
    const draft = issueDraftToken();
    const up = await uploadPhoto(draft.token, Buffer.from("MZ\x90\x00 this is an executable"));
    const res = await up.complete();
    expect(res.ok).toBe(false);
    expect((await getStore().getAttachment(up.id))?.status).toBe("rejected");
  });

  it("rejects unsupported types and oversized files before upload", async () => {
    const draft = issueDraftToken();
    expect((await signUpload({ draftToken: draft.token, name: "a.heic", type: "image/heic", size: 1000 })).ok).toBe(false);
    expect((await signUpload({ draftToken: draft.token, name: "a.pdf", type: "application/pdf", size: 1000 })).ok).toBe(false);
    expect((await signUpload({ draftToken: draft.token, name: "a.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 })).ok).toBe(false);
  });

  it("caps uploads at five per request", async () => {
    const draft = issueDraftToken();
    for (let i = 0; i < 5; i++) expect((await signUpload({ draftToken: draft.token, name: "a.jpg", type: "image/jpeg", size: 1000 })).ok).toBe(true);
    expect((await signUpload({ draftToken: draft.token, name: "a.jpg", type: "image/jpeg", size: 1000 })).ok).toBe(false);
  });

  it("will not attach another session's photo to a request", async () => {
    const owner = issueDraftToken(Date.now() - 10_000);
    const attacker = issueDraftToken(Date.now() - 10_000);
    const up = await uploadPhoto(owner.token, await jpeg());
    await up.complete();
    expect((await completeUpload({ draftToken: attacker.token, attachmentId: up.id })).ok).toBe(false);
    const out = await submitQuoteRequest(validPayload({ attachmentIds: [up.id] }, attacker));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.status).toBe(409);
    expect(await getStore().listQuoteRequests(10)).toHaveLength(0);
  });
});

describe("notification outbox", () => {
  it("sends the internal notification and customer receipt once", async () => {
    const out = await submitQuoteRequest(validPayload());
    if (!out.ok) throw new Error("submit failed");
    const results = await processOutbox();
    expect(results.map((r) => r.status)).toEqual(["sent", "sent"]);
    expect(await processOutbox()).toHaveLength(0); // nothing left to send

    const files = (await fs.readdir(path.join(dir, "outbox"))).filter((f) => f.endsWith(".json"));
    const mails = await Promise.all(files.map(async (f) => JSON.parse(await fs.readFile(path.join(dir, "outbox", f), "utf8"))));
    const internal = mails.find((m) => m.to[0] === "support@jmtenterprise.net");
    expect(internal.subject).toBe(`New JMT quote request ${out.reference} — Marketplace and personal purchase pickups`);
    expect(internal.replyTo).toBe("customer@example.com");
    expect(internal.text).toContain("Pickup access: Yes, stairs; floor 3; No elevator");
    const receipt = mails.find((m) => m.to[0] === "customer@example.com");
    expect(receipt.replyTo).toBe("support@jmtenterprise.net");
    expect(receipt.text).toContain(`Your reference is ${out.reference}`);
  });

  it("keeps the saved request and schedules a retry when email is temporarily unavailable", async () => {
    serverConfig.devMailFailure = "transient";
    const out = await submitQuoteRequest(validPayload());
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    const results = await processOutbox();
    expect(results.every((r) => r.status === "pending")).toBe(true);
    const saved = await getStore().getQuoteRequest(out.reference);
    expect(saved).not.toBeNull();
    for (const j of saved!.notifications) {
      expect(j.attempts).toBe(1);
      expect(new Date(j.nextAttemptAt).getTime()).toBeGreaterThan(Date.now());
      expect(j.needsAttention).toBe(false);
    }
    // Recovery: make the job due again and restore email.
    serverConfig.devMailFailure = "";
    for (const j of saved!.notifications) await getStore().updateJob(j.id, { nextAttemptAt: new Date(0).toISOString() });
    expect((await processOutbox()).map((r) => r.status)).toEqual(["sent", "sent"]);
  });

  it("flags permanent failures for an operator instead of retrying forever", async () => {
    serverConfig.devMailFailure = "permanent";
    await submitQuoteRequest(validPayload());
    await processOutbox();
    const flagged = await getStore().listJobsNeedingAttention();
    expect(flagged).toHaveLength(2);
    expect(flagged.every((j) => j.status === "failed")).toBe(true);
  });

  it("gives up after the maximum number of transient attempts", async () => {
    serverConfig.devMailFailure = "transient";
    const out = await submitQuoteRequest(validPayload());
    if (!out.ok) throw new Error();
    const saved = await getStore().getQuoteRequest(out.reference);
    for (const j of saved!.notifications) await getStore().updateJob(j.id, { attempts: MAX_ATTEMPTS - 1 });
    await processOutbox();
    expect(await getStore().listJobsNeedingAttention()).toHaveLength(2);
  });
});
