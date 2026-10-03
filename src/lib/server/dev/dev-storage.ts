/**
 * DEVELOPMENT ADAPTER — not for production.
 * Keeps photos in .data/uploads and serves them through HMAC-signed,
 * expiring URLs handled by /api/dev-storage. It mimics the private bucket and
 * signed URLs of the Supabase adapter so the browser flow is identical.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { serverConfig, uploadSecret } from "../config";
import type { PhotoStorage } from "../types";

const root = () => path.join(serverConfig.devDataDir, "uploads");

export function safeKeyPath(key: string): string {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  return path.join(root(), key);
}

export function signDevUrl(op: "put" | "get", key: string, expires: number): string {
  return crypto.createHmac("sha256", uploadSecret()).update(`${op}:${key}:${expires}`).digest("base64url");
}

export function verifyDevUrl(op: "put" | "get", key: string, expires: number, sig: string): boolean {
  if (!Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  const expected = Buffer.from(signDevUrl(op, key, expires));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

export class DevPhotoStorage implements PhotoStorage {
  readonly label = "development local file storage (.data/uploads)";

  private url(op: "put" | "get", key: string, ttl: number) {
    const expires = Math.floor(Date.now() / 1000) + ttl;
    const q = new URLSearchParams({ key, expires: String(expires), sig: signDevUrl(op, key, expires) });
    return `${serverConfig.siteUrl}/api/dev-storage?${q}`;
  }

  async createUploadUrl(key: string, contentType: string) {
    return { url: this.url("put", key, 15 * 60), headers: { "content-type": contentType } };
  }
  async read(key: string) {
    try {
      return await fs.readFile(safeKeyPath(key));
    } catch {
      return null;
    }
  }
  async write(key: string, data: Buffer) {
    const p = safeKeyPath(key);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, data);
  }
  async remove(keys: string[]) {
    await Promise.all(keys.map((k) => fs.rm(safeKeyPath(k), { force: true })));
  }
  async signedReadUrl(key: string, ttlSeconds: number) {
    return this.url("get", key, ttlSeconds);
  }
}
