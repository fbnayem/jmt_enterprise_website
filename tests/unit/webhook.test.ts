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
