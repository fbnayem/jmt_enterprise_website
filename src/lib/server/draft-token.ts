/**
 * A draft token ties photo uploads and the final submission to one form
 * session without requiring an account. It is an HMAC-signed draft id with an
 * issue time; uploads are only accepted for, and only attachable to, that id.
 */
import crypto from "node:crypto";
import { uploadSecret } from "./config";

const TTL_MS = 24 * 3600 * 1000;

const sign = (payload: string) => crypto.createHmac("sha256", uploadSecret()).update(payload).digest("base64url");

export function issueDraftToken(now = Date.now()): { draftId: string; token: string } {
  const draftId = crypto.randomUUID();
  const payload = `${draftId}.${now}`;
  return { draftId, token: `${payload}.${sign(payload)}` };
}

export function verifyDraftToken(token: string, now = Date.now()): { draftId: string; issuedAt: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [draftId, issued, sig] = parts;
  const expected = Buffer.from(sign(`${draftId}.${issued}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || now - issuedAt > TTL_MS || issuedAt > now + 60_000) return null;
  return { draftId, issuedAt };
}
