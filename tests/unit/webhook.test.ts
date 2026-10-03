import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifySvixSignature } from "@/lib/server/resend-webhook";

const secretBytes = crypto.randomBytes(24);
const secret = `whsec_${secretBytes.toString("base64")}`;
const sign = (id: string, ts: string, body: string, key = secretBytes) =>
  `v1,${crypto.createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64")}`;

describe("Resend webhook signature", () => {
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
  const ts = String(Math.floor(Date.now() / 1000));

  it("accepts a correctly signed event", () => {
    expect(verifySvixSignature(secret, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, body)).toBe(true);
  });
  it("rejects a tampered body, wrong key or stale timestamp", () => {
    expect(verifySvixSignature(secret, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, body + " ")).toBe(false);
    expect(verifySvixSignature(secret, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body, crypto.randomBytes(24)) }, body)).toBe(false);
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(verifySvixSignature(secret, { id: "msg_1", timestamp: old, signature: sign("msg_1", old, body) }, body)).toBe(false);
  });
});

describe("Resend webhook ordering", () => {
  it("never moves a delivered email back to delayed", async () => {
    const { setAdapters, getStore } = await import("@/lib/server/adapters");
    const { DevLeadStore } = await import("@/lib/server/dev/dev-store");
    const { handleResendEvent } = await import("@/lib/server/resend-webhook");
    const fs = await import("node:fs/promises");
    const os = await import("node:os");
    const path = await import("node:path");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wh-"));
    const store = new DevLeadStore(dir);
    setAdapters({ store });
    const job = { id: crypto.randomUUID(), kind: "internal" as const, recipient: "ops@example.com" };
    const draft = crypto.randomUUID();
    await store.submitQuoteRequest(
      { id: crypto.randomUUID(), reference: "JMT-261003-AAAAA", idempotencyKey: crypto.randomUUID(), draftId: draft, createdAt: new Date().toISOString(), timezone: "UTC", acknowledgementVersion: "x", request: {} as never, source: {}, jobs: [job] },
      [],
    );
    await store.updateJob(job.id, { status: "sent", providerMessageId: "em_1" });
    await handleResendEvent({ type: "email.delivered", data: { email_id: "em_1" } });
    await handleResendEvent({ type: "email.delivery_delayed", data: { email_id: "em_1" } });
    expect((await getStore().findJobByProviderId("em_1"))?.status).toBe("delivered");
  });
});
